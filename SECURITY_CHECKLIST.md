# 🔒 Checklist de Sécurité - Système d'Authentification DiagPV

**Version** : 1.0.0  
**Date** : 17 novembre 2025  
**Objectif** : Validation sécurité avant activation production (AUTH_ENABLED=true)

---

## ⚠️ Statut Actuel : NON PRODUCTION-READY

**AUTH_ENABLED** : ❌ `false` (désactivé par défaut)  
**Hash Password** : ❌ SHA-256 MOCK (NON sécurisé)  
**Rate Limiting** : ❌ Absent  
**2FA** : ❌ Absent  
**Secrets** : ❌ Non configurés

---

## 📋 Checklist Critique (À Compléter AVANT Activation)

### 🔴 Niveau 1 : CRITIQUE (Bloquant)

#### 1.1 Hash Password bcrypt

**Statut** : ❌ **MOCK SHA-256 (NON SÉCURISÉ)**

**Problème** :
```typescript
// src/modules/auth/utils.ts - ACTUEL
export async function hashPassword(password: string): Promise<string> {
  // MOCK: SHA-256 simple - VULNÉRABLE aux rainbow tables
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Solution** :
```bash
npm install bcryptjs @types/bcryptjs
```

```typescript
// src/modules/auth/utils.ts - SÉCURISÉ
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10); // 10 rounds = 2^10 = 1024 iterations
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

**Test** :
```bash
# Générer hash bcrypt test
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('TestPassword!123', 10));"

# Vérifier format : $2b$10$...
```

**Deadline** : ⏰ **AVANT ACTIVATION**

---

#### 1.2 Secrets Production

**Statut** : ❌ **ABSENTS**

**Problème** : Aucun secret configuré pour :
- SESSION_SECRET (signature tokens)
- JWT_SECRET (si JWT utilisé)

**Solution** :
```bash
# Générer secrets forts (256 bits)
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Configurer Cloudflare
npx wrangler secret put SESSION_SECRET --project-name diagnostic-hub
# Coller le secret généré

npx wrangler secret put JWT_SECRET --project-name diagnostic-hub
# Coller le secret généré
```

**Vérification** :
```bash
npx wrangler secret list --project-name diagnostic-hub
```

**Deadline** : ⏰ **AVANT ACTIVATION**

---

#### 1.3 Rate Limiting Login

**Statut** : ❌ **ABSENT**

**Problème** : Vulnérable aux attaques brute-force sur `/api/auth/login`

**Solution** : Créer `src/modules/auth/rate-limiter.ts`

```typescript
// Rate limiting: 10 tentatives / 10 minutes par IP
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { 
      count: 1, 
      resetAt: now + 10 * 60 * 1000 // 10 minutes
    });
    return true;
  }

  if (record.count >= 10) {
    return false; // Bloqué
  }

  record.count++;
  return true;
}

export function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}
```

**Intégrer dans routes** :
```typescript
// src/modules/auth/routes.ts
import { checkRateLimit, resetRateLimit } from './rate-limiter'

app.post('/login', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Real-IP') || 'unknown';
  
  if (!checkRateLimit(ip)) {
    return c.json({
      success: false,
      error: 'Trop de tentatives de connexion. Veuillez réessayer dans 10 minutes.',
      retry_after: 600 // secondes
    }, 429);
  }

  // ... login logic

  if (loginSuccess) {
    resetRateLimit(ip); // Reset compteur après succès
  }
});
```

**Test** :
```bash
# Tenter 11 logins échoués rapidement
for i in {1..11}; do
  curl -X POST https://e66e71cb.diagnostic-hub.pages.dev/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.fr","password":"wrong"}'
  echo
done

# Le 11ème doit retourner 429 Too Many Requests
```

**Deadline** : ⏰ **AVANT ACTIVATION**

---

### 🟡 Niveau 2 : IMPORTANT (Recommandé)

#### 2.1 Validation Email Stricte

**Statut** : ⚠️ **BASIQUE**

**Amélioration** :
```typescript
// src/modules/auth/utils.ts
export function validateEmail(email: string): boolean {
  // RFC 5322 compliant
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!regex.test(email)) return false;
  
  // Bloquer emails jetables connus
  const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  return !disposableDomains.includes(domain);
}
```

**Deadline** : 📅 Semaine 1 après activation

---

#### 2.2 Logs Activité Étendus

**Statut** : ⚠️ **BASIQUE**

**Amélioration** : Logger davantage d'informations
```typescript
// src/modules/auth/routes.ts
await env.DB.prepare(`
  INSERT INTO activity_logs (
    user_id, action, entity_type, details, 
    ip_address, user_agent, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
`).bind(
  userId,
  'login_success',
  'session',
  JSON.stringify({ remember_me: rememberMe }),
  c.req.header('CF-Connecting-IP'),
  c.req.header('User-Agent')
).run();
```

**Deadline** : 📅 Semaine 2 après activation

---

#### 2.3 Expiration Sessions Automatique

**Statut** : ⚠️ **MANUEL**

**Amélioration** : Cleanup automatique sessions expirées
```typescript
// src/modules/auth/cleanup.ts
export async function cleanupExpiredSessions(db: D1Database): Promise<number> {
  const result = await db.prepare(`
    DELETE FROM sessions 
    WHERE expires_at < datetime('now')
  `).run();
  
  return result.meta.changes || 0;
}

// Appeler périodiquement (Cloudflare Cron Trigger)
// wrangler.jsonc
{
  "triggers": {
    "crons": ["0 2 * * *"] // Tous les jours à 2h du matin
  }
}
```

**Deadline** : 📅 Mois 1 après activation

---

#### 2.4 Notifications Email

**Statut** : ❌ **ABSENT**

**Amélioration** : Notifier événements critiques
- Nouveau compte créé
- Mot de passe changé
- Assignation créée/révoquée
- Login depuis nouvelle IP
- Échecs login multiples

**Solution** : Intégrer SendGrid/Mailgun
```typescript
// src/modules/auth/notifications.ts
import { sendEmail } from './email-service';

export async function notifyUserCreated(user: User, temporaryPassword: string) {
  await sendEmail({
    to: user.email,
    subject: 'Votre compte DiagPV a été créé',
    template: 'user-created',
    data: {
      fullName: user.full_name,
      email: user.email,
      temporaryPassword,
      loginUrl: 'https://e66e71cb.diagnostic-hub.pages.dev/login'
    }
  });
}
```

**Deadline** : 📅 Mois 2 après activation

---

### 🟢 Niveau 3 : OPTIONNEL (Nice to Have)

#### 3.1 Two-Factor Authentication (2FA)

**Statut** : ❌ **ABSENT**

**Options** :
- **TOTP** (Google Authenticator, Authy) - Recommandé
- **SMS** (Twilio) - Plus simple mais moins sécurisé
- **Email** - Fallback

**Priorité** : 📅 Trimestre 2 2026

---

#### 3.2 OAuth Social Login

**Statut** : ❌ **ABSENT**

**Options** :
- Google OAuth
- Microsoft Azure AD
- GitHub (pour développeurs)

**Priorité** : 📅 Trimestre 3 2026

---

#### 3.3 API Keys pour Intégrations

**Statut** : ❌ **ABSENT**

**Use case** : Intégrations externes (Zapier, custom scripts)

**Priorité** : 📅 Trimestre 4 2026

---

#### 3.4 Webhooks

**Statut** : ❌ **ABSENT**

**Use case** : Notifier systèmes tiers sur événements
- Nouveau sous-traitant
- Audit assigné
- Audit complété

**Priorité** : 📅 2027

---

## 🧪 Tests de Sécurité

### Test 1 : Injection SQL

**Objectif** : Vérifier protection contre SQL injection

```bash
# Tenter injection dans login
curl -X POST https://e66e71cb.diagnostic-hub.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diagpv.fr'\'' OR 1=1--","password":"test"}'

# Résultat attendu: Échec login (pas d'injection réussie)
```

**Status** : ✅ **PROTÉGÉ** (D1 prepared statements)

---

### Test 2 : XSS (Cross-Site Scripting)

**Objectif** : Vérifier échappement HTML

```bash
# Créer utilisateur avec nom malveillant
curl -X POST https://e66e71cb.diagnostic-hub.pages.dev/api/auth/admin/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.fr","full_name":"<script>alert(1)</script>","password":"Test!123","role":"subcontractor"}'

# Vérifier affichage dans /admin/users (doit être échappé)
```

**Status** : ⚠️ **À VÉRIFIER** (échappement HTML dans interfaces)

---

### Test 3 : CSRF (Cross-Site Request Forgery)

**Objectif** : Vérifier protection CSRF sur actions sensibles

**Status** : ⚠️ **ABSENT** (pas de CSRF tokens)

**Recommandation** : Implémenter CSRF tokens pour POST/PUT/DELETE

---

### Test 4 : Session Fixation

**Objectif** : Vérifier régénération session après login

```bash
# 1. Obtenir session avant login
# 2. Login avec session existante
# 3. Vérifier nouvelle session générée
```

**Status** : ✅ **PROTÉGÉ** (nouveau token UUID à chaque login)

---

### Test 5 : Brute Force Protection

**Objectif** : Valider rate limiting

```bash
# Script test brute-force
for i in {1..20}; do
  echo "Tentative $i"
  curl -s -X POST https://e66e71cb.diagnostic-hub.pages.dev/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@diagpv.fr","password":"wrong"}' | jq -r '.error'
done
```

**Status** : ❌ **NON PROTÉGÉ** (rate limiting à implémenter)

---

## 📊 Matrice de Risques

| Risque | Probabilité | Impact | Sévérité | Statut | Mitigation |
|--------|-------------|--------|----------|--------|------------|
| **Hash faible (SHA-256)** | HAUTE | CRITIQUE | 🔴 **CRITIQUE** | ❌ Non résolu | Implémenter bcrypt |
| **Pas de rate limiting** | HAUTE | HAUTE | 🔴 **CRITIQUE** | ❌ Non résolu | Implémenter rate limiter |
| **Pas de secrets** | MOYENNE | HAUTE | 🟡 **IMPORTANT** | ❌ Non résolu | Configurer secrets |
| **Pas de 2FA** | BASSE | MOYENNE | 🟢 **OPTIONNEL** | ❌ Non résolu | Planifier Q2 2026 |
| **SQL Injection** | BASSE | CRITIQUE | ✅ **PROTÉGÉ** | ✅ Résolu | D1 prepared statements |
| **XSS** | MOYENNE | MOYENNE | ⚠️ **À VÉRIFIER** | ⏳ En cours | Échapper HTML |
| **CSRF** | MOYENNE | MOYENNE | ⚠️ **À IMPLÉMENTER** | ❌ Non résolu | Ajouter CSRF tokens |

---

## ✅ Validation Finale

### Checklist Avant Activation AUTH_ENABLED=true

- [ ] ✅ Hash bcrypt implémenté et testé
- [ ] ✅ SESSION_SECRET configuré en production
- [ ] ✅ JWT_SECRET configuré en production
- [ ] ✅ Rate limiting implémenté (10/10min)
- [ ] ✅ Compte admin re-créé avec hash bcrypt
- [ ] ✅ Tests complets effectués (3 sous-traitants)
- [ ] ✅ Échappement HTML vérifié
- [ ] ✅ Logs activité fonctionnels
- [ ] ✅ Documentation à jour
- [ ] ✅ Procédure rollback préparée
- [ ] ✅ Backup complet effectué
- [ ] ✅ Équipe formée sur gestion utilisateurs

### Signature Validation

**Date validation** : _________________

**Validé par** : Adrien PAPPALARDO

**Commentaires** :
```
______________________________________________
______________________________________________
______________________________________________
```

---

## 📞 Contact Urgence

**En cas de faille de sécurité détectée** :

1. **Rollback immédiat** : `AUTH_ENABLED = false`
2. **Analyser logs** : `activity_logs` + Cloudflare Analytics
3. **Notifier utilisateurs** : Si données compromises
4. **Patch vulnérabilité** : Selon analyse
5. **Re-test complet** : Avant réactivation

**Contact** : Adrien PAPPALARDO - Diagnostic Photovoltaïque  
**Email** : a.pappalardo@diagnosticphotovoltaique.fr

---

**⚠️ NE PAS ACTIVER AUTH_ENABLED=true TANT QUE CHECKLIST CRITIQUE NON COMPLÉTÉE ⚠️**

**Version** : 1.0.0  
**Dernière révision** : 17 novembre 2025
