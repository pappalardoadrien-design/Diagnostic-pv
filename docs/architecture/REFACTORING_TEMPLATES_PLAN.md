# Plan de Refactoring - Templates HTML

## Contexte
Le fichier `src/index.tsx` contient actuellement **10 590 lignes** dont **10 templates HTML inline** représentant environ **9 000 lignes**.

## Templates à extraire

| # | Route | Lignes | Taille | Priorité | Complexité |
|---|-------|--------|--------|----------|------------|
| 1 | `/tools` | 571-1050 | ~480 | Basse | Faible |
| 2 | `/audit/:token` | 1064-1755 | ~691 | Haute | Moyenne |
| 3 | `generateReportHTML()` | 1758-2408 | ~650 | Haute | Moyenne |
| 4 | `/dashboard` | 2412-2722 | ~310 | Moyenne | Faible |
| 5 | `/pv/plants` | 2728-3037 | ~309 | Basse | Faible |
| 6 | `/pv/installations` | 3043-3314 | ~271 | Basse | Faible |
| 7 | `/pv/plant/:id/zone/:zoneId/editor` | 3320-3942 | ~622 | Moyenne | Haute |
| 8 | `/pv/plant/:id/zone/:zoneId/editor/v2` | 3946-9838 | **~5892** | **CRITIQUE** | **Très Haute** |
| 9 | `/pv/plant/:id` | 9844-10362 | ~518 | Moyenne | Moyenne |
| 10 | `/opensolar` | 10368-10590 | ~222 | Basse | Faible |

## Stratégie de refactoring

### Phase 1 - Templates simples (Priorité Basse)
1. Extraire `/tools` vers `src/pages/tools.ts`
2. Extraire `/pv/plants` vers `src/pages/pv-plants.ts`
3. Extraire `/pv/installations` vers `src/pages/pv-installations.ts`
4. Extraire `/opensolar` vers `src/pages/opensolar.ts`

### Phase 2 - Templates métier (Priorité Moyenne)
1. Extraire `/dashboard` vers `src/pages/dashboard-audits.ts`
2. Extraire `/pv/plant/:id` vers `src/pages/pv-plant-detail.ts`
3. Extraire `generateReportHTML()` vers `src/utils/report-generator.ts`

### Phase 3 - Templates complexes (Priorité Haute)
1. Extraire `/audit/:token` vers `src/pages/audit-terrain.ts`
2. Extraire `/pv/plant/:id/zone/:zoneId/editor` vers `src/pages/pv-editor-v1.ts`

### Phase 4 - Editor V2 (CRITIQUE)
L'editor V2 représente **56% du fichier** (5892 lignes sur 10590).
- Option A: Extraire vers `src/pages/pv-editor-v2.ts` (fonction exportant le HTML)
- Option B: Convertir en fichier statique `public/static/pv/editor-v2.html`
- Option C: Migrer vers un composant frontend React/Vue

## Pattern d'extraction

```typescript
// src/pages/example-page.ts
export function getExamplePage(params?: { id?: string }): string {
  return \`
    <!DOCTYPE html>
    <html lang="fr">
    ...
    </html>
  \`
}
```

```typescript
// src/index.tsx - Route mise à jour
import { getExamplePage } from './pages/example-page'

app.get('/example/:id', (c) => {
  const id = c.req.param('id')
  return c.html(getExamplePage({ id }))
})
```

## Risques et mitigation

1. **Syntaxe cassée** - Toujours tester le build après chaque extraction
2. **Variables de template** - S'assurer que \${plantId}, \${zoneId} etc. sont passés correctement
3. **CSS inline** - Préserver les styles critiques pour le thème nocturne
4. **Scripts inline** - Certains templates ont du JS inline qui dépend de variables serveur

## Prérequis avant refactoring

- [ ] Backup complet du projet (FAIT: https://www.genspark.ai/api/files/s/pls0TlRv)
- [ ] Tests automatisés pour chaque route (À FAIRE)
- [ ] Documentation des dépendances entre templates
- [ ] Environnement de staging pour tester les changements

## État actuel (08/01/2026)

- **Build**: OK (1655.47 kB)
- **Production**: https://diagnostic-hub.pages.dev (Tous modules fonctionnels)
- **Backup**: https://www.genspark.ai/api/files/s/pls0TlRv (34.5 MB)
- **Tailwind CSS v4**: Installé via @tailwindcss/vite

## Recommandation

**NE PAS effectuer le refactoring des templates tant que les tests automatisés ne sont pas en place.** Le risque de régression est trop élevé pour un gain de maintenabilité modéré.

Priorité recommandée:
1. Mettre en place CI/CD avec tests
2. Extraire les templates simples (Phase 1)
3. Valider en staging
4. Continuer progressivement
