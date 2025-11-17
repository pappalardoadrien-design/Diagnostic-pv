# 🚀 Guide de Démarrage Rapide - Système d'Authentification DiagPV

**Version** : 1.0.0  
**Date** : 17 novembre 2025  
**Pour** : Adrien PAPPALARDO - Diagnostic Photovoltaïque

---

## 📋 Table des Matières

1. [Première Connexion Admin](#première-connexion-admin)
2. [Créer un Sous-traitant](#créer-un-sous-traitant)
3. [Assigner un Audit](#assigner-un-audit)
4. [Tests Recommandés](#tests-recommandés)
5. [Activation Complète](#activation-complète)
6. [Dépannage](#dépannage)

---

## 🔐 Première Connexion Admin

### Étape 1 : Accéder à la Page Login

**URL** : https://e66e71cb.diagnostic-hub.pages.dev/login

### Étape 2 : Se Connecter avec le Compte Admin

```
Email    : a.pappalardo@diagnosticphotovoltaique.fr
Password : DiagPV2025!Temp
```

⚠️ **IMPORTANT** : Vous serez automatiquement redirigé vers `/change-password` car `must_change_password=true`.

### Étape 3 : Changer le Mot de Passe

1. Entrez l'ancien mot de passe : `DiagPV2025!Temp`
2. Entrez un nouveau mot de passe fort :
   - **Minimum 8 caractères**
   - Au moins 1 majuscule
   - Au moins 1 minuscule
   - Au moins 1 chiffre
   - Au moins 1 caractère spécial (@, #, $, %, etc.)

**Exemple de mot de passe fort** :
```
DiagPV@2025!Secure
Adrien#PV$2025
Photovolt@1que!2025
```

3. L'indicateur de force vous guidera :
   - 🔴 **Faible** : Moins de 8 caractères ou critères manquants
   - 🟡 **Moyen** : 8+ caractères, quelques critères OK
   - 🟢 **Fort** : Tous les critères respectés

4. Cliquez sur **"Changer le mot de passe"**

✅ **Vous êtes maintenant connecté en tant qu'admin !**

---

## 👤 Créer un Sous-traitant

### Accéder à la Gestion Utilisateurs

**URL** : https://e66e71cb.diagnostic-hub.pages.dev/admin/users

Ou depuis le Dashboard → **Admin** → **Utilisateurs**

### Créer un Nouveau Sous-traitant

1. **Cliquez sur le bouton orange** "➕ Nouvel Utilisateur"

2. **Remplissez le formulaire** :

```
📧 Email         : jean.dupont@exemple.fr
👤 Nom complet   : Jean Dupont
🏢 Entreprise    : Électricité Dupont SARL
👔 Rôle          : Subcontractor (Sous-traitant)
🔒 Mot de passe  : Dupont@2025!Temp
```

3. **Cochez les options** :
   - ✅ **Actif** (is_active) - Le compte sera immédiatement utilisable
   - ✅ **Doit changer le mot de passe** - L'utilisateur devra changer son mot de passe au premier login

4. **Cliquez sur "Créer l'utilisateur"**

✅ **Le sous-traitant est créé !**

### Informations à Communiquer au Sous-traitant

**Par email sécurisé** :

```
Bonjour Jean,

Votre compte DiagPV Diagnostic Hub a été créé.

🔗 URL de connexion : https://e66e71cb.diagnostic-hub.pages.dev/login
📧 Email            : jean.dupont@exemple.fr
🔒 Mot de passe     : Dupont@2025!Temp

⚠️ Vous devrez changer votre mot de passe lors de votre première connexion.

Choisissez un mot de passe fort avec :
- Au moins 8 caractères
- Majuscules + minuscules
- Chiffres + caractères spéciaux

Cordialement,
Adrien PAPPALARDO
Diagnostic Photovoltaïque
```

### Recommandations Sécurité

- 🔒 **Envoyez le mot de passe temporaire par un canal sécurisé** (email chiffré, SMS, appel)
- 📞 **Confirmez la réception** avec le sous-traitant
- ⏱️ **Demandez le changement immédiat** du mot de passe
- 🚫 **Ne réutilisez jamais** le même mot de passe temporaire

---

## 📋 Assigner un Audit

### Accéder à la Gestion Assignations

**URL** : https://e66e71cb.diagnostic-hub.pages.dev/admin/assignments

Ou depuis le Dashboard → **Admin** → **Assignations**

### Créer une Nouvelle Assignation

1. **Cliquez sur le bouton orange** "➕ Nouvelle Assignation"

2. **Sélectionnez le sous-traitant** :
   - Dropdown avec tous les sous-traitants actifs
   - Exemple : "Jean Dupont (jean.dupont@exemple.fr)"

3. **Sélectionnez l'audit EL** :
   - Dropdown avec tous les audits EL disponibles
   - Exemple : "JALIBAT - Total Energies"

4. **Définissez les permissions** :

```
👁️ Lecture      : ✅ (Toujours coché par défaut)
✏️ Édition      : ✅ (Si vous voulez qu'il puisse modifier les modules)
🗑️ Suppression  : ❌ (Généralement non pour sous-traitants)
```

**Recommandations par rôle** :

| Rôle | Lecture | Édition | Suppression |
|------|---------|---------|-------------|
| **Technicien terrain** | ✅ | ✅ | ❌ |
| **Superviseur** | ✅ | ✅ | ✅ |
| **Consultant externe** | ✅ | ❌ | ❌ |

5. **Date d'expiration (optionnel)** :
   - Laissez vide pour accès permanent
   - Ou définissez une date : `31/12/2025 23:59`

6. **Notes (optionnel)** :
```
Technicien EL spécialisé audits résidentiels
Intervient pour mission JALIBAT uniquement
Fin de mission prévue janvier 2026
```

7. **Cliquez sur "Créer l'assignation"**

✅ **Le sous-traitant a maintenant accès à l'audit !**

### Vérifier l'Assignation

**Filtres disponibles** :
- 🔍 **Recherche** : Nom, email, projet
- 👤 **Utilisateur** : Sélectionner un sous-traitant spécifique
- 📋 **Audit** : Sélectionner un audit spécifique
- 📊 **Statut** : Active, Révoquée, Expirée

**Statistiques affichées** :
- Total assignations
- Actives
- Révoquées
- Sous-traitants uniques

### Modifier une Assignation

1. Cliquez sur **✏️ (icône édition)** dans la table
2. Modifiez les permissions, date d'expiration ou notes
3. Cliquez sur **"Enregistrer"**

### Révoquer un Accès

1. Cliquez sur **🚫 (icône révocation)** dans la table
2. Confirmez la révocation
3. Le statut passe de **"Active"** à **"Révoquée"**

⚠️ **Note** : La révocation est un soft delete. L'assignation reste dans la base de données pour l'historique.

---

## ✅ Tests Recommandés

### Test 1 : Workflow Complet Sous-traitant

**Objectif** : Valider le parcours utilisateur complet

1. **Créer 2 comptes tests** :
   ```
   test1@diagpv.fr - Technicien Terrain
   test2@diagpv.fr - Superviseur
   ```

2. **Assigner audit test** :
   - Test1 : Lecture + Édition
   - Test2 : Lecture + Édition + Suppression

3. **Se connecter avec test1** :
   - Login → Change password
   - Vérifier accès limité aux audits assignés
   - Tester édition module
   - Vérifier impossibilité de supprimer

4. **Se connecter avec test2** :
   - Login → Change password
   - Vérifier permissions complètes
   - Tester suppression module (si applicable)

5. **Révoquer accès test1** :
   - Se reconnecter avec test1
   - Vérifier message d'erreur "Accès révoqué"

### Test 2 : Sécurité Mots de Passe

**Objectif** : Valider les règles de sécurité

1. **Tester mots de passe faibles** :
   ```
   ❌ "12345678"      → Rejeté (pas de majuscule, pas de spécial)
   ❌ "password"      → Rejeté (trop court, pas de chiffre)
   ❌ "Password123"   → Rejeté (pas de caractère spécial)
   ```

2. **Tester mots de passe forts** :
   ```
   ✅ "DiagPV@2025!Test"
   ✅ "Secure#PV$123"
   ✅ "MyP@ssw0rd!2025"
   ```

3. **Vérifier indicateur de force** :
   - 🔴 Faible → 🟡 Moyen → 🟢 Fort

### Test 3 : Expiration Sessions

**Objectif** : Valider la gestion des sessions

1. **Se connecter sans "Remember me"** :
   - Session expire après 24h
   - Tester reconnexion après expiration

2. **Se connecter avec "Remember me"** :
   - Session expire après 30 jours
   - Tester reconnexion automatique

3. **Tester logout manuel** :
   - Session immédiatement invalidée
   - Redirection vers /login

### Test 4 : Filtres et Recherche

**Objectif** : Valider les fonctionnalités admin

1. **Page Admin Users** :
   - Filtrer par rôle (admin, subcontractor)
   - Filtrer par statut (actif, inactif)
   - Recherche par nom/email

2. **Page Admin Assignments** :
   - Filtrer par utilisateur
   - Filtrer par audit
   - Filtrer par statut (active, revoked)
   - Recherche textuelle

### Test 5 : Logs d'Activité

**Objectif** : Valider la traçabilité

1. **Effectuer des actions** :
   - Créer utilisateur
   - Modifier assignation
   - Révoquer accès

2. **Vérifier les logs** :
   - Cliquer sur "Détails" d'un utilisateur
   - Vérifier les 20 derniers logs
   - Confirmer timestamps et actions

---

## 🚀 Activation Complète

### Prérequis Avant Activation

**⚠️ CRITIQUE** : Ne PAS activer AUTH_ENABLED=true sans compléter ces étapes.

#### 1. Remplacer Hash SHA-256 par bcrypt

**Actuellement** : Hash MOCK (NON sécurisé)

```bash
# 1. Installer bcrypt
cd /home/user/webapp
npm install bcryptjs @types/bcryptjs

# 2. Modifier src/modules/auth/utils.ts
```

**Code à remplacer** :

```typescript
// AVANT (MOCK - NON SÉCURISÉ)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}
```

**Par** :

```typescript
// APRÈS (SÉCURISÉ)
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10); // 10 rounds
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

**3. Recréer le compte admin avec hash bcrypt** :

```bash
# Générer nouveau hash bcrypt pour DiagPV2025!Temp
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('DiagPV2025!Temp', 10));"

# Mettre à jour en production
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="UPDATE auth_users SET password_hash='<nouveau_hash>' WHERE id=1"
```

#### 2. Configurer Secrets Production

```bash
# Générer secrets forts
openssl rand -base64 32  # Pour SESSION_SECRET
openssl rand -base64 32  # Pour JWT_SECRET

# Configurer dans Cloudflare
npx wrangler secret put SESSION_SECRET --project-name diagnostic-hub
npx wrangler secret put JWT_SECRET --project-name diagnostic-hub
```

#### 3. Ajouter Rate Limiting

**Créer** : `src/modules/auth/rate-limiter.ts`

```typescript
// Rate limiting simple (10 tentatives / 10 minutes par IP)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }

  if (record.count >= 10) {
    return false; // Bloqué
  }

  record.count++;
  return true;
}
```

**Modifier** : `src/modules/auth/routes.ts`

```typescript
import { checkRateLimit } from './rate-limiter'

app.post('/login', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  
  if (!checkRateLimit(ip)) {
    return c.json({
      success: false,
      error: 'Trop de tentatives. Veuillez réessayer dans 10 minutes.'
    }, 429);
  }
  
  // ... reste du code login
});
```

#### 4. Activer le Middleware

**Modifier** : `src/modules/auth/middleware.ts`

```typescript
// AVANT
export const AUTH_ENABLED = false;

// APRÈS
export const AUTH_ENABLED = true;
```

**Protéger les routes** : `src/index.tsx`

```typescript
import { requireAuth, requireRole, requireAuditAccess } from './modules/auth/middleware'

// Protéger toutes les routes API
app.use('/api/*', requireAuth)

// Protéger routes admin
app.use('/admin/*', requireAuth)
app.use('/admin/*', requireRole('admin'))

// Protéger accès audits
app.use('/api/el/audit/:token/*', requireAuditAccess)
```

### Procédure d'Activation

```bash
# 1. Tests locaux
npm run build
npm run dev:d1

# 2. Tests Cloudflare
npm run deploy

# 3. Validation complète
# - Tester login/logout
# - Tester assignations
# - Tester permissions
# - Tester rate limiting

# 4. Activer progressivement
# Phase 1: AUTH_ENABLED=true pour /admin/* uniquement
# Phase 2: Étendre à /api/el/*
# Phase 3: Activation complète
```

### Rollback d'Urgence

Si problèmes après activation :

```typescript
// src/modules/auth/middleware.ts
export const AUTH_ENABLED = false; // ROLLBACK IMMÉDIAT

// Puis redéployer
npm run build && npm run deploy
```

---

## 🆘 Dépannage

### Problème : Impossible de Se Connecter

**Symptômes** : Erreur "Identifiants invalides"

**Solutions** :
1. Vérifier email exact (case-sensitive)
2. Vérifier mot de passe (copier-coller pour éviter typos)
3. Vérifier compte actif : `is_active=1`
4. Vérifier hash password correct dans DB

**Diagnostic DB** :
```bash
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT id, email, is_active, must_change_password FROM auth_users WHERE email='a.pappalardo@diagnosticphotovoltaique.fr'"
```

### Problème : Page Blanche Après Login

**Symptômes** : Écran noir ou blanc, pas de redirection

**Solutions** :
1. Vider cache navigateur (Ctrl+Shift+Del)
2. Tester en navigation privée
3. Vérifier console JavaScript (F12)
4. Vérifier session créée en DB

**Diagnostic Session** :
```bash
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT * FROM sessions WHERE user_id=1 ORDER BY created_at DESC LIMIT 5"
```

### Problème : Sous-traitant Ne Voit Pas Audit

**Symptômes** : Audit n'apparaît pas dans liste après assignation

**Solutions** :
1. Vérifier assignation active : `status='active'`
2. Vérifier expiration : `expires_at` non dépassé
3. Vérifier permissions : `can_view=1`

**Diagnostic Assignation** :
```bash
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT * FROM audit_assignments WHERE user_id=<ID> AND audit_token='<TOKEN>'"
```

### Problème : Erreur 500 Lors Création Utilisateur

**Symptômes** : Message "Erreur création utilisateur"

**Solutions** :
1. Vérifier unicité email (pas de doublon)
2. Vérifier format email valide
3. Vérifier rôle valide (admin, subcontractor, client, auditor)

**Diagnostic Logs** :
```bash
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT * FROM activity_logs WHERE action='user_creation_failed' ORDER BY created_at DESC LIMIT 5"
```

### Problème : Session Expire Trop Vite

**Symptômes** : Déconnexion fréquente même avec "Remember me"

**Solutions** :
1. Vérifier checkbox "Remember me" cochée
2. Vérifier cookies activés dans navigateur
3. Vérifier KV namespace fonctionnel

**Vérifier Configuration** :
```typescript
// src/modules/auth/routes.ts
const expiresIn = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
```

### Problème : Rate Limiting Bloque Admin

**Symptômes** : "Trop de tentatives" même pour admin

**Solutions** :
1. Attendre 10 minutes
2. Temporairement désactiver rate limiting
3. Whitelister IP admin

```typescript
// src/modules/auth/rate-limiter.ts
const ADMIN_IPS = ['123.456.789.0']; // IP bureau DiagPV

export function checkRateLimit(ip: string): boolean {
  if (ADMIN_IPS.includes(ip)) return true; // Bypass admin
  // ... reste du code
}
```

---

## 📞 Support

### Contacts

**Développement** : DiagPV Assistant Pro  
**Validation** : Adrien PAPPALARDO  
**Production** : Diagnostic Photovoltaïque

### Resources

- 📄 **Documentation complète** : `AUTH_SYSTEM_STATUS.md`
- 🌐 **Production** : https://e66e71cb.diagnostic-hub.pages.dev
- 💾 **Backup** : https://www.genspark.ai/api/files/s/jFfX1Ii6
- 💻 **GitHub** : https://github.com/pappalardoadrien-design/Diagnostic-pv

### Commandes Utiles

```bash
# Vérifier état production
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT COUNT(*) as total FROM auth_users"

# Lister tous utilisateurs actifs
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT id, email, full_name, role FROM auth_users WHERE is_active=1"

# Lister assignations actives
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT COUNT(*) as total FROM audit_assignments WHERE status='active'"

# Derniers logs activité
npx wrangler d1 execute diagnostic-hub-production --remote \
  --command="SELECT action, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 10"
```

---

## 🎯 Checklist de Lancement

### Avant Premier Utilisation Réelle

- [ ] Tester login admin avec nouveau mot de passe fort
- [ ] Créer 2 comptes sous-traitants tests
- [ ] Assigner audits tests avec permissions différentes
- [ ] Tester workflow complet (login → édition → logout)
- [ ] Vérifier logs d'activité enregistrés
- [ ] Tester révocation accès
- [ ] Documenter procédure interne pour création comptes

### Avant Activation AUTH_ENABLED=true

- [ ] Installer bcrypt : `npm install bcryptjs @types/bcryptjs`
- [ ] Remplacer hash SHA-256 par bcrypt dans utils.ts
- [ ] Recréer hash admin avec bcrypt
- [ ] Configurer SESSION_SECRET et JWT_SECRET
- [ ] Implémenter rate limiting sur /login
- [ ] Tester en local : `npm run dev:d1`
- [ ] Tester en production staging
- [ ] Valider avec 3 sous-traitants réels
- [ ] Préparer procédure rollback

### Après Activation

- [ ] Monitorer logs première semaine
- [ ] Recueillir feedback sous-traitants
- [ ] Ajuster permissions si nécessaire
- [ ] Documenter procédures internes
- [ ] Former équipe sur gestion utilisateurs
- [ ] Planifier revue sécurité mensuelle

---

**✨ Votre système d'authentification est prêt ! Suivez ce guide étape par étape pour un déploiement sécurisé et progressif. ✨**

**Bon courage Adrien ! 🚀**
