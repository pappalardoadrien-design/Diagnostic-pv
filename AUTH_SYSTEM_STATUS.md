# 🔐 Système d'Authentification DiagPV - Statut Final

**Date de création** : 2025-11-17  
**Version** : 1.0.0  
**Statut** : ✅ Déployé en Production (AUTH_ENABLED=false par défaut)

---

## 📋 Vue d'Ensemble

Système d'authentification multi-rôles complet pour DiagPV Diagnostic Hub, permettant la gestion de 20+ sous-traitants avec permissions granulaires sur les audits photovoltaïques.

### Objectif Principal
Permettre à Adrien PAPPALARDO (admin) de créer et gérer des comptes pour sous-traitants, leur assigner des audits EL spécifiques avec des permissions granulaires (lecture/écriture/validation).

---

## 🏗️ Architecture Déployée

### Base de Données (Cloudflare D1)

**4 tables créées dans la migration 0022_create_auth_system.sql** :

#### 1. `auth_users`
Table principale des utilisateurs (renommée de `users` pour éviter conflit avec table EL existante).

```sql
CREATE TABLE auth_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company TEXT,
  role TEXT NOT NULL CHECK(role IN ('admin', 'subcontractor', 'client', 'auditor')),
  is_active BOOLEAN DEFAULT 1,
  must_change_password BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);
```

**Rôles disponibles** :
- `admin` : Administrateur (Adrien) - Accès complet
- `subcontractor` : Sous-traitant - Accès limité aux audits assignés
- `client` : Client - Consultation uniquement
- `auditor` : Auditeur - Validation des résultats

#### 2. `sessions`
Gestion des sessions utilisateurs avec support KV pour performance.

```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);
```

**Durée de session** :
- 24 heures par défaut
- 30 jours avec "Remember me"

#### 3. `audit_assignments`
Assignations granulaires des utilisateurs aux audits avec permissions détaillées.

```sql
CREATE TABLE audit_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  can_view BOOLEAN DEFAULT 1,
  can_edit BOOLEAN DEFAULT 0,
  can_delete BOOLEAN DEFAULT 0,
  allowed_modules TEXT,  -- JSON: ["el", "iv", "visual"] ou NULL pour tous
  assigned_by INTEGER NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'revoked', 'expired')),
  expires_at DATETIME,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES auth_users(id)
);
```

**Permissions granulaires** :
- `can_view` : Consultation de l'audit
- `can_edit` : Modification des données
- `can_delete` : Suppression de modules/données
- `allowed_modules` : Restriction par type de module (EL, I-V, Visuel, etc.)

#### 4. `activity_logs`
Traçabilité complète des actions utilisateurs (audit trail).

```sql
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE SET NULL
);
```

---

## 🔌 API Routes Déployées

### Routes d'Authentification Publiques
**Base** : `/api/auth`

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/login` | Authentification (email + password) |
| POST | `/logout` | Déconnexion (invalide session) |
| GET | `/me` | Info utilisateur connecté |
| POST | `/change-password` | Changement de mot de passe |

### Routes Admin - Gestion Utilisateurs
**Base** : `/api/auth/admin`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/users` | Liste utilisateurs (filtres: role, status, search) |
| GET | `/users/:id` | Détails utilisateur + logs d'activité |
| POST | `/users` | Créer utilisateur |
| PUT | `/users/:id` | Modifier utilisateur |
| DELETE | `/users/:id` | Désactiver utilisateur (soft delete) |
| GET | `/stats` | Statistiques globales |

### Routes Admin - Gestion Assignations
**Base** : `/api/auth/admin/assignments`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste assignations (filtres: user, audit, status, search) |
| GET | `/:id` | Détails assignation + logs |
| POST | `/` | Créer assignation |
| PUT | `/:id` | Modifier assignation |
| DELETE | `/:id` | Révoquer assignation (status='revoked') |
| GET | `/user/:userId/audits` | Audits assignés à un utilisateur |
| GET | `/audit/:token/users` | Utilisateurs assignés à un audit |

---

## 🖥️ Interfaces Web Déployées

### 1. Page Login
**URL** : `/login`  
**Fonctionnalités** :
- Formulaire email/password
- Toggle visibilité mot de passe
- Checkbox "Remember me" (30 jours)
- Redirection vers `/change-password` si must_change_password=true
- Design DiagPV noir/orange

### 2. Page Change Password
**URL** : `/change-password`  
**Fonctionnalités** :
- Indicateur force du mot de passe (temps réel)
- Validation des exigences (8 chars, majuscule, minuscule, chiffre, spécial)
- 3 champs (ancien, nouveau, confirmation)
- Toggle visibilité sur tous les champs

### 3. Page Admin Users
**URL** : `/admin/users`  
**Fonctionnalités** :
- **Stats** : Total, actifs, sous-traitants, activité 7j
- **Filtres** : Recherche, rôle, statut
- **Table** : Liste avec actions inline (éditer, activer/désactiver)
- **Modal Create/Edit** : Formulaire complet avec validation
- **Badges rôles** : admin (violet), subcontractor (bleu), client (vert), auditor (orange)

### 4. Page Admin Assignments
**URL** : `/admin/assignments`  
**Fonctionnalités** :
- **Stats** : Total, actives, révoquées, users uniques
- **Filtres** : Recherche, utilisateur, audit, statut
- **Table** : Assignations avec permissions inline
- **Modal Create/Edit** :
  - Sélection sous-traitant (dropdown auto-chargé)
  - Sélection audit (dropdown auto-chargé)
  - Checkboxes permissions (👁️ Lecture, ✏️ Édition, 🗑️ Suppression)
  - Date expiration optionnelle
  - Notes optionnelles
- **Actions** : Éditer, Révoquer

---

## 🔒 Sécurité

### Mot de Passe
**⚠️ IMPORTANT** : Hash actuel = MOCK SHA-256 (NON PRODUCTION-READY)

**État actuel** :
```typescript
// src/modules/auth/utils.ts
export async function hashPassword(password: string): Promise<string> {
  // MOCK: SHA-256 simple (NON SÉCURISÉ pour production)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

**À faire AVANT activation AUTH_ENABLED=true** :
```bash
npm install bcryptjs @types/bcryptjs
```

```typescript
// Remplacer dans src/modules/auth/utils.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

### Session Management
- Token UUID v4 (128 bits de sécurité)
- Stockage KV pour performance
- Expiration automatique
- Invalider session au logout

### Soft Delete
- Utilisateurs : `is_active = 0`
- Assignations : `status = 'revoked'`
- Permet historique et restauration

---

## 👤 Compte Admin Initial

**Email** : a.pappalardo@diagnosticphotovoltaique.fr  
**Nom** : Adrien PAPPALARDO  
**Rôle** : admin  
**Password temporaire** : DiagPV2025!Temp  
**Must change password** : ✅ Oui (sécurité renforcée)

**⚠️ Mot de passe doit être changé lors du premier login.**

---

## 🚀 Déploiement Production

### URLs
- **Production** : https://e66e71cb.diagnostic-hub.pages.dev
- **Login** : https://e66e71cb.diagnostic-hub.pages.dev/login
- **Admin Users** : https://e66e71cb.diagnostic-hub.pages.dev/admin/users
- **Admin Assignments** : https://e66e71cb.diagnostic-hub.pages.dev/admin/assignments

### Base de Données
- **Nom** : diagnostic-hub-production
- **ID** : 72be68d4-c5c5-4854-9ead-3bbcc131d199
- **Région** : Cloudflare Workers Global
- **Migration** : 0022_create_auth_system.sql (appliquée le 2025-11-17)

### Fichiers Déployés
```
src/
├── modules/auth/
│   ├── routes.ts                  # Auth publique (login, logout, me)
│   ├── admin-routes.ts            # Admin CRUD users
│   ├── assignments-routes.ts      # Admin CRUD assignments
│   ├── middleware.ts              # requireAuth, requireRole, requireAuditAccess
│   ├── types.ts                   # TypeScript types
│   └── utils.ts                   # hashPassword, verifyPassword, tokens
├── pages/
│   ├── login.ts                   # Interface login
│   ├── change-password.ts         # Interface change password
│   ├── admin-users.ts             # Interface gestion users (18KB)
│   └── admin-assignments.ts       # Interface gestion assignments (29KB)
└── index.tsx                      # Routes montées
```

**Taille totale** : 263.72 kB (worker.js)

---

## 🔧 Configuration

### Activation du Système (OPT-IN)

**État actuel** : AUTH_ENABLED = false (système non-intrusif)

Le système d'authentification est **complètement déployé** mais **désactivé par défaut** pour ne pas perturber les fonctionnalités existantes.

**Pour activer** :
```typescript
// src/modules/auth/middleware.ts
export const AUTH_ENABLED = true; // Passer à true
```

**Appliquer middleware aux routes protégées** :
```typescript
// Exemple: Protéger le module EL
import { requireAuth, requireAuditAccess } from './modules/auth/middleware'

app.use('/api/el/*', requireAuth) // Nécessite auth
app.use('/api/el/audit/:token/*', requireAuditAccess) // Vérifie permissions audit
```

### Variables d'Environnement

**Actuelles** : Aucune variable requise (tout en DB)

**Recommandées pour production** :
```bash
# .dev.vars (local)
SESSION_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-here

# wrangler.jsonc (production - via secrets)
npx wrangler secret put SESSION_SECRET
npx wrangler secret put JWT_SECRET
```

---

## ✅ Tests de Validation

### Tests Effectués (2025-11-17)

**1. Pages Web** : ✅ TOUS HTTP 200
- `/login`
- `/change-password`
- `/admin/users`
- `/admin/assignments`

**2. API Routes** : ✅ TOUTES success:true
- GET `/api/auth/admin/users` → 1 user (admin)
- GET `/api/auth/admin/users/1` → User trouvé
- GET `/api/auth/admin/stats` → Success
- GET `/api/auth/admin/assignments` → 0 assignments (normal)

**3. Base de Données** : ✅ TOUTES tables créées
- `auth_users` → 1 row (admin)
- `sessions` → 0 rows
- `audit_assignments` → 0 rows
- `activity_logs` → 1 row (system_init)

**4. Compte Admin** : ✅ Créé correctement
- Email: a.pappalardo@diagnosticphotovoltaique.fr
- Role: admin
- is_active: 1
- must_change_password: 1

---

## 📊 Statistiques Déploiement

- **Commits** : 9 commits (Phase 6 Auth System)
- **Fichiers créés** : 8 fichiers (routes + pages)
- **Lignes de code** : ~3000 lignes TypeScript + ~1500 lignes HTML/CSS/JS
- **Temps de build** : <1s
- **Taille worker.js** : 263.72 kB
- **Migration DB** : 0022_create_auth_system.sql (129 lignes)

---

## 🎯 Prochaines Étapes Recommandées

### Avant Activation Complète (AUTH_ENABLED=true)

1. **Sécurité Critique** :
   - [ ] Remplacer hash SHA-256 par bcrypt
   - [ ] Ajouter rate limiting sur /login (10 tentatives/10min)
   - [ ] Ajouter CAPTCHA après 5 échecs login
   - [ ] Configurer SESSION_SECRET et JWT_SECRET

2. **Tests Utilisateurs** :
   - [ ] Créer 2-3 comptes sous-traitants tests
   - [ ] Assigner audits tests
   - [ ] Tester workflow complet : login → audit assigné → édition
   - [ ] Tester révocation accès
   - [ ] Tester expiration sessions

3. **Monitoring** :
   - [ ] Implémenter logging Cloudflare Workers
   - [ ] Dashboard activité (qui a accédé à quoi, quand)
   - [ ] Alertes sur échecs login multiples

4. **Documentation** :
   - [ ] Guide utilisateur pour sous-traitants
   - [ ] Procédure création compte sous-traitant
   - [ ] Procédure assignation audit

### Fonctionnalités Futures (Optionnel)

- [ ] 2FA (SMS ou TOTP)
- [ ] OAuth Google/Microsoft
- [ ] Notifications email (nouveau compte, expiration accès)
- [ ] Export logs audit (CSV/PDF)
- [ ] API key pour intégrations externes
- [ ] Webhook sur événements (nouveau user, assignment, etc.)

---

## 📝 Notes Importantes

### Coexistence avec Système Existant

Le système auth a été conçu pour **coexister pacifiquement** avec le système EL existant :

- Table `auth_users` (nouvelle) ≠ table `users` (existante pour techniciens EL)
- Pas de FOREIGN KEY vers `el_audits` (optionnel)
- AUTH_ENABLED=false par défaut (système inactif)
- Pas de modification des routes existantes

### Migration de Données (Si nécessaire)

Si vous voulez migrer les utilisateurs existants (`users` table) vers `auth_users` :

```sql
-- Migration manuelle (adapter selon besoins)
INSERT INTO auth_users (email, full_name, role, password_hash, company, is_active, must_change_password)
SELECT 
  email || '@diagnosticphotovoltaique.fr' as email,
  name as full_name,
  'subcontractor' as role,
  '$2b$10$...' as password_hash, -- Générer hash temporaire
  'Sous-traitant DiagPV' as company,
  1 as is_active,
  1 as must_change_password
FROM users
WHERE certification_level IS NOT NULL;
```

### Limitations Connues

1. **Hash password MOCK** : SHA-256 simple (NON sécurisé pour production)
2. **Pas de rate limiting** : Vulnérable aux brute-force
3. **Pas de 2FA** : Authentification simple uniquement
4. **Pas de notifications** : Événements non notifiés par email
5. **assigned_by hardcodé** : TODO: récupérer depuis session réelle

---

## 🆘 Support & Contact

**Développeur** : DiagPV Assistant Pro  
**Date création** : 2025-11-17  
**Version** : 1.0.0  
**Statut** : Production (désactivé par défaut)

**Pour activation** : Suivre les étapes "Prochaines Étapes Recommandées" ci-dessus.

---

**✨ Le système d'authentification DiagPV est prêt pour la gestion de 20+ sous-traitants avec permissions granulaires. Activation en attente de validation bcrypt et tests utilisateurs. ✨**
