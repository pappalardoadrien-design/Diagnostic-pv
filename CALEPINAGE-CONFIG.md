# 📐 Configuration Plan de Calepinage

## 🎯 Comment gérer les flèches de câblage

### Fichier de configuration
**Emplacement** : `/home/user/webapp/src/modules/el/routes/calepinage-grid.ts`

### Configuration JALIBAT actuelle

```typescript
'JALIBAT-2025-001': {
  wiring: [
    'left-to-right',   // S1: 26 modules, gauche → droite
    'right-to-left',   // S2: 24 modules, droite → gauche
    'left-to-right',   // S3: 24 modules, gauche → droite
    'right-to-left',   // S4: 24 modules, droite → gauche
    'left-to-right',   // S5: 24 modules, gauche → droite
    'right-to-left',   // S6: 24 modules, droite → gauche
    'left-to-right',   // S7: 24 modules, gauche → droite
    'right-to-left',   // S8: 24 modules, droite → gauche
    'left-to-right',   // S9: 24 modules, gauche → droite
    'right-to-left',   // S10: 24 modules, droite → gauche
  ],
  arrows: [
    { fromString: 1, toString: 2, position: 'end' },    // S1 fin → S2 début
    { fromString: 2, toString: 3, position: 'start' },  // S2 début → S3 début
    { fromString: 3, toString: 4, position: 'end' },    // S3 fin → S4 fin
    { fromString: 4, toString: 5, position: 'start' },  // S4 début → S5 début
    { fromString: 5, toString: 6, position: 'end' },    // S5 fin → S6 fin
    { fromString: 6, toString: 7, position: 'start' },  // S6 début → S7 début
    { fromString: 7, toString: 8, position: 'end' },    // S7 fin → S8 fin
    { fromString: 8, toString: 9, position: 'start' },  // S8 début → S9 début
    { fromString: 9, toString: 10, position: 'end' },   // S9 fin → S10 fin
  ]
}
```

---

## 📝 Comment modifier la configuration

### 1. Direction des strings (`wiring`)

Pour chaque string, spécifie la direction du câblage :
- `'left-to-right'` : Câblage de gauche → droite
- `'right-to-left'` : Câblage de droite → gauche

**Exemple** : Si tu veux que S1 aille de droite à gauche :
```typescript
wiring: [
  'right-to-left',   // S1: droite → gauche (MODIFIÉ)
  'right-to-left',   // S2: droite → gauche
  // ...
]
```

### 2. Flèches de connexion (`arrows`)

Pour chaque connexion entre strings, définis :
- `fromString` : Numéro de la string source (1-10)
- `toString` : Numéro de la string destination (1-10)
- `position` : Où placer la flèche
  - `'start'` : Au début de la string source (côté gauche si left-to-right)
  - `'end'` : À la fin de la string source (côté droit si left-to-right)

**Exemple** : Connexion S3 fin → S4 début
```typescript
{ fromString: 3, toString: 4, position: 'end' }
```

### 3. Ajouter/Supprimer des flèches

**Supprimer une flèche** : Retire la ligne correspondante
```typescript
arrows: [
  { fromString: 1, toString: 2, position: 'end' },
  // { fromString: 2, toString: 3, position: 'start' },  // ❌ SUPPRIMÉ
  { fromString: 3, toString: 4, position: 'end' },
]
```

**Ajouter une flèche** : Ajoute une nouvelle ligne
```typescript
arrows: [
  { fromString: 1, toString: 2, position: 'end' },
  { fromString: 1, toString: 3, position: 'end' },  // ✅ NOUVEAU
  { fromString: 2, toString: 3, position: 'start' },
]
```

---

## 🔧 Workflow de modification

1. **Éditer le fichier** :
   ```bash
   nano /home/user/webapp/src/modules/el/routes/calepinage-grid.ts
   ```

2. **Modifier la configuration** dans `WIRING_CONFIGS['JALIBAT-2025-001']`

3. **Rebuild et restart** :
   ```bash
   cd /home/user/webapp && npm run build
   pm2 restart diagnostic-hub
   ```

4. **Tester** :
   ```bash
   curl http://localhost:3000/api/el/calepinage-grid/JALIBAT-2025-001
   ```
   Ou ouvrir dans le navigateur :
   https://3000-ihjl3q1cxb8r55v93w6w4-6532622b.e2b.dev/api/el/calepinage-grid/JALIBAT-2025-001

---

## 📌 Exemples de configurations

### Configuration serpentin classique (actuelle)
```typescript
arrows: [
  { fromString: 1, toString: 2, position: 'end' },    // Fin S1 → Début S2
  { fromString: 2, toString: 3, position: 'start' },  // Début S2 → Début S3
  { fromString: 3, toString: 4, position: 'end' },    // Fin S3 → Fin S4
  // ...
]
```

### Configuration linéaire (toutes gauche→droite)
```typescript
wiring: Array(10).fill('left-to-right'),
arrows: [
  { fromString: 1, toString: 2, position: 'end' },
  { fromString: 2, toString: 3, position: 'end' },
  { fromString: 3, toString: 4, position: 'end' },
  // ...
]
```

### Configuration custom (ex: regroupement par 3)
```typescript
arrows: [
  { fromString: 1, toString: 2, position: 'end' },
  { fromString: 2, toString: 3, position: 'start' },
  { fromString: 3, toString: 4, position: 'end' },
  // Pas de flèche entre S4 et S5 (gap)
  { fromString: 5, toString: 6, position: 'end' },
  // ...
]
```

---

## ✅ Checklist après modification

- [ ] Fichier `calepinage-grid.ts` modifié
- [ ] Configuration `WIRING_CONFIGS['JALIBAT-2025-001']` mise à jour
- [ ] Build réussi (`npm run build`)
- [ ] PM2 redémarré (`pm2 restart diagnostic-hub`)
- [ ] Plan testé dans navigateur
- [ ] Flèches apparaissent au bon endroit
- [ ] Couleurs des modules correctes
- [ ] Export PDF fonctionne (Ctrl+P)

---

## 🆘 Dépannage

**Problème** : Les flèches n'apparaissent pas
- Vérifier que `fromString` et `toString` correspondent à des strings existantes
- Vérifier que `position` est soit `'start'` soit `'end'`

**Problème** : Les flèches sont au mauvais endroit
- Essayer de changer `position` de `'start'` à `'end'` ou vice-versa
- Vérifier que `wiring[fromString-1]` correspond à la bonne direction

**Problème** : Build échoue
- Vérifier la syntaxe TypeScript
- Vérifier que toutes les virgules sont présentes
- Vérifier que les accolades sont bien fermées

---

## 📞 Contact
Si tu as besoin d'aide pour configurer un câblage spécifique, envoie-moi :
1. Le schéma de câblage que tu veux représenter
2. La configuration actuelle qui ne fonctionne pas
3. Ce que tu attends comme résultat
