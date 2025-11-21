# 🤝 Guide de Contribution - DiagPV Hub

Merci de votre intérêt pour contribuer à DiagPV Hub !

---

## 📋 Code de conduite

- Respecter les autres contributeurs
- Être constructif dans les discussions
- Suivre les conventions du projet

---

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Cloudflare (pour déploiement)

### Installation

```bash
# Cloner le repository
git clone https://github.com/USERNAME/diagpv-hub.git
cd diagpv-hub

# Installer dépendances
npm install

# Créer .dev.vars depuis .env.example
cp .env.example .dev.vars

# Appliquer migrations D1 (local)
npm run db:migrate:local

# Build
npm run build

# Démarrer dev server avec PM2
pm2 start ecosystem.config.cjs

# Vérifier
curl http://localhost:3000
```

---

## 🏗️ Architecture

### Structure projet

```
/home/user/webapp/
├── src/
│   ├── index.tsx              # Entry point Hono app
│   ├── modules/               # Modules métier
│   │   ├── calepinage/       # ⭐ Module calepinage v4.0
│   │   ├── el/               # Module électroluminescence
│   │   ├── iv/               # Module courbes I-V
│   │   ├── visual/           # Module inspections visuelles
│   │   └── ...
│   └── pages/                 # Pages HTML
├── migrations/                # Migrations D1
├── public/                    # Assets statiques
├── wrangler.jsonc            # Config Cloudflare
└── package.json
```

### Stack technique

- **Runtime** : Cloudflare Workers
- **Framework** : Hono (TypeScript)
- **Database** : Cloudflare D1 (SQLite)
- **Frontend** : HTML/CSS/JS vanilla + TailwindCSS CDN
- **Build** : Vite
- **Deploy** : Wrangler CLI

---

## 📝 Conventions

### Git commits

Utiliser [Conventional Commits](https://www.conventionalcommits.org/fr/) :

```bash
feat: Ajouter nouvelle fonctionnalité
fix: Corriger bug dans module X
docs: Mettre à jour documentation
style: Formatter code (pas de changement logique)
refactor: Refactoriser module Y
test: Ajouter tests pour Z
chore: Tâches maintenance (build, CI, etc.)
```

**Exemples** :
```bash
feat(calepinage): Ajouter outil rotation modules
fix(el): Corriger calcul statistiques défauts
docs: Mettre à jour guide déploiement
test(calepinage): Ajouter tests outil flèche
```

### Branches

- `main` : Production (protégée)
- `develop` : Développement (intégration)
- `feature/nom-feature` : Nouvelles fonctionnalités
- `fix/nom-bug` : Corrections bugs
- `docs/nom-doc` : Documentation

**Workflow** :
```bash
# Créer branche feature
git checkout -b feature/mon-feature

# Développer, commit
git add .
git commit -m "feat: Ma nouvelle fonctionnalité"

# Push
git push origin feature/mon-feature

# Créer Pull Request vers develop
```

### Code TypeScript

```typescript
// ✅ BON
interface ModulePosition {
  identifier: string
  x: number
  y: number
}

function getModuleColor(identifier: string): string {
  // ...
}

// ❌ MAUVAIS
function getColor(id) {  // Pas de types
  // ...
}
```

### Nommage

- **Fichiers** : kebab-case (`api-layouts.ts`)
- **Classes** : PascalCase (`CalepinageLayout`)
- **Fonctions** : camelCase (`getModuleStates`)
- **Constantes** : UPPER_SNAKE_CASE (`BASE_URL`)
- **Variables** : camelCase (`moduleList`)

---

## 🧪 Tests

### Lancer tests

```bash
# Tests calepinage automatiques
npm run test:calepinage

# Tests manuels
npm test
```

### Ajouter tests

Ajouter scénarios dans `test-calepinage.sh` :

```bash
# Test 12: Nouvelle fonctionnalité
echo "🔍 Test 12: Ma nouvelle fonctionnalité"
response=$(curl -s "$BASE_URL/api/mon-endpoint")
check_response "$response" "attendu" "Description test"
echo ""
```

---

## 📦 Créer un module

### Structure module

```typescript
// src/modules/mon-module/index.ts
import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const monModule = new Hono<{ Bindings: Bindings }>()

// Routes
monModule.get('/list', async (c) => {
  const { DB } = c.env
  // ...
  return c.json({ data: [] })
})

export default monModule
```

### Enregistrer module

```typescript
// src/index.tsx
import monModule from './modules/mon-module'
app.route('/api/mon-module', monModule)
```

### Migration D1

```sql
-- migrations/XXXX_add_mon_module.sql
CREATE TABLE IF NOT EXISTS mon_module_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mon_module_name ON mon_module_data(name);
```

Appliquer :
```bash
npm run db:migrate:local
```

---

## 🐛 Debugging

### Logs

```typescript
// En développement
console.log('Debug:', data)
console.error('Erreur:', error)

// En production (Cloudflare)
// Voir logs dans Dashboard → Workers → Logs
```

### D1 Database

```bash
# Console locale
npm run db:console:local

# Requêtes SQL
wrangler d1 execute diagpv-audit-production --local \
  --command="SELECT * FROM calepinage_layouts"
```

### Hot reload

Le mode dev recompile automatiquement :
```bash
# Terminal 1
npm run build

# Terminal 2 (PM2 surveille dist/)
pm2 restart diagnostic-hub
```

---

## 📚 Documentation

### Documenter fonctionnalité

1. **Code** : Commentaires TypeScript
2. **README** : Section dans README principal
3. **Changelog** : Entrée dans CHANGELOG.md
4. **Guide** : Fichier MD dédié si complexe

### Exemple commentaire

```typescript
/**
 * Génère un plan de calepinage SVG dynamique
 * 
 * @param viewBox - Dimensions canvas (width, height)
 * @param modules - Liste modules positionnés
 * @param moduleStates - États EL des modules
 * @returns SVG string complet
 */
function generateSVG(
  viewBox: ViewBox,
  modules: ModulePosition[],
  moduleStates: Record<string, ModuleState>
): string {
  // ...
}
```

---

## 🚢 Déploiement

### Checklist avant deploy

- [ ] Tous tests passent (`npm run test:calepinage`)
- [ ] Build réussit (`npm run build`)
- [ ] Migrations appliquées (`npm run db:migrate:prod`)
- [ ] Variables env configurées (Cloudflare Dashboard)
- [ ] Documentation à jour
- [ ] CHANGELOG.md mis à jour
- [ ] Version bumpée (package.json)

### Déployer

```bash
# Production
npm run deploy:prod

# Ou manual
npm run build
npx wrangler pages deploy dist --project-name diagpv-hub
```

---

## ❓ Questions fréquentes

### "Module not found" après ajout nouveau module

**Solution** :
```bash
rm -rf node_modules .wrangler
npm install
npm run build
```

### "D1_ERROR: no such table"

**Solution** :
```bash
npm run db:migrate:local  # ou db:migrate:prod
```

### Tests échouent

**Solution** :
1. Vérifier service running : `pm2 list`
2. Restart : `pm2 restart diagnostic-hub`
3. Check logs : `pm2 logs --nostream`

---

## 📞 Support

**Questions techniques** :
- Ouvrir issue GitHub
- Email : adrien@diagnosticphotovoltaique.fr

**Pull Requests** :
- Décrire changements clairement
- Ajouter tests si applicable
- Mettre à jour documentation
- Attendre review avant merge

---

**Merci de contribuer à DiagPV Hub ! 🙏**
