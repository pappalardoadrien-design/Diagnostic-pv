# 📘 Guide d'Import depuis Module EL

## 🎯 Vue d'ensemble

Le système d'import dynamique permet d'importer **n'importe quelle configuration d'audit EL** dans Canvas V2, plus seulement la configuration Jalibat hardcodée.

---

## 🚀 Utilisation

### 1. Prérequis
- Avoir créé un **polygone de toiture** (Étape 0 dans Canvas V2)
- Avoir au moins un **audit EL** dans la base de données

### 2. Ouvrir la modal d'import
1. Aller dans **Canvas V2** d'une zone
2. Cliquer sur **"IMPORTER DEPUIS MODULE EL"** (bouton violet)
3. La modal s'ouvre avec la liste des audits disponibles

### 3. Sélectionner un audit
- Voir tous les audits EL disponibles avec :
  - 📁 Nom du projet et client
  - 📊 Nombre total de modules
  - 📐 Configuration (strings × modules/string)
  - 🔴 Modules avec défauts
  - 📅 Date et avancement
  
- Cliquer sur **"IMPORTER"** sur l'audit souhaité

### 4. Confirmer
- Une popup de confirmation affiche les détails
- Valider pour créer le rectangle automatiquement

### 5. Ajuster
- Le rectangle apparaît centré sur la toiture
- Utiliser les **handles** pour ajuster :
  - **Coins** : Redimensionner
  - **Centre (↻)** : Pivoter
  - **Drag** : Déplacer

---

## 🗄️ Audits de Test Disponibles

Pour le développement local, 6 audits de test sont disponibles :

| Projet | Client | Modules | Config | Usage |
|--------|--------|---------|--------|-------|
| **Centrale Jalibat** | Jalibat Solar | 242 | 11×22 | Configuration classique |
| **Ferme Provence** | EDF Renouvelables | 500 | 20×25 | Grande installation |
| **Toiture Lyon** | Engie Green | 144 | 8×18 | Installation moyenne |
| **Parking Marseille** | TotalEnergies | 300 | 15×20 | Ombrières |
| **Résidentiel Nice** | Particulier | 24 | 2×12 | Petite installation |
| **Commercial Toulouse** | Bouygues | 180 | 12×15 | Installation commerciale |

---

## 🔧 Gestion des Audits de Test

### Créer des audits de test

```bash
# Exécuter le script de seed
npx wrangler d1 execute diagnostic-hub-production --local --file=./seed-test-audits.sql
```

### Supprimer les audits de test

```bash
# Supprimer tous les audits de test
npx wrangler d1 execute diagnostic-hub-production --local --command="DELETE FROM el_audits WHERE audit_token LIKE '%-TEST' OR audit_token LIKE '%-2024-%'"
```

### Créer un audit personnalisé

```bash
npx wrangler d1 execute diagnostic-hub-production --local --command="
INSERT INTO el_audits (
  audit_token, 
  project_name, 
  client_name, 
  location,
  string_count, 
  modules_per_string, 
  total_modules,
  status,
  completion_rate
) VALUES (
  'MON-AUDIT-2024',
  'Mon Projet',
  'Mon Client',
  'Ma Ville, France',
  10,
  20,
  200,
  'completed',
  100.0
)"
```

### Lister les audits

```bash
# Voir tous les audits
npx wrangler d1 execute diagnostic-hub-production --local --command="
SELECT 
  audit_token,
  project_name,
  total_modules,
  string_count || 'x' || modules_per_string as config,
  status,
  completion_rate || '%' as progress
FROM el_audits
ORDER BY created_at DESC"
```

---

## 🔍 API Backend

### Endpoint disponible

```
GET /api/pv/available-el-audits
```

**Retourne** :
```json
{
  "success": true,
  "audits": [
    {
      "id": 1,
      "audit_token": "JALIBAT-2024-TEST",
      "project_name": "Centrale Solaire Jalibat",
      "client_name": "Jalibat Solar",
      "location": "Jalibat, France",
      "string_count": 11,
      "modules_per_string": 22,
      "total_modules": 242,
      "status": "completed",
      "completion_rate": 100,
      "modules_with_defects": 0,
      "is_linked": 0
    }
  ],
  "total": 1
}
```

---

## 🎨 Interface Utilisateur

### Bouton d'import
- **Icône** : 📥 File Import
- **Couleur** : Violet (purple-600)
- **Position** : Sous le bouton "CRÉER RECTANGLE"

### Modal
- **Titre** : "IMPORTER CONFIGURATION DEPUIS MODULE EL"
- **Couleur** : Bordure violette (purple-400)
- **Contenu** : Liste scrollable d'audits
- **Cartes d'audit** : Hover effect (bordure violette)

### Feedback visuel
- 🔄 **Chargement** : Spinner animé
- 📭 **Vide** : Message "Aucun audit EL disponible"
- ❌ **Erreur** : Message d'erreur en rouge
- ✅ **Succès** : Alert avec détails de l'import

---

## 📊 Fonctionnalités

### ✅ Implémenté
- Liste tous les audits EL disponibles
- Affichage des statistiques (modules, strings, défauts)
- Import dynamique (n'importe quelle configuration)
- Adaptation automatique aux dimensions de la toiture
- Calcul d'échelle (92% de la surface)
- Support multi-audits
- Badge "DÉJÀ LIÉ" pour audits utilisés

### 🔄 À venir
- Import de plusieurs rectangles depuis un audit
- Prévisualisation 3D de la configuration
- Export de la configuration vers un nouvel audit
- Liaison bidirectionnelle audit ↔ zone
- Synchronisation automatique des défauts

---

## 🐛 Debugging

### Vérifier les audits en DB

```bash
# Local
npx wrangler d1 execute diagnostic-hub-production --local --command="SELECT COUNT(*) as total FROM el_audits"

# Production
npx wrangler d1 execute diagnostic-hub-production --remote --command="SELECT COUNT(*) as total FROM el_audits"
```

### Tester l'API

```bash
# Via curl
curl http://localhost:3000/api/pv/available-el-audits | python3 -m json.tool

# Compter les audits
curl -s http://localhost:3000/api/pv/available-el-audits | python3 -c "import sys, json; print('Total:', json.load(sys.stdin)['total'])"
```

### Logs console

```javascript
// Dans la console du navigateur
console.log("Audits chargés:", moduleRectangles.length)
console.log("Rectangles:", moduleRectangles)
```

---

## 📚 Ressources

- **Code frontend** : `/home/user/diagnostic-hub/src/index.tsx` (ligne ~7254)
- **Code backend** : `/home/user/diagnostic-hub/src/modules/pv/routes/el-links.ts` (ligne ~8)
- **Script seed** : `/home/user/diagnostic-hub/seed-test-audits.sql`
- **Migrations DB** : `/home/user/diagnostic-hub/migrations/`

---

## 🎯 Avantages vs Ancien Système

| Critère | Avant (hardcodé) | Maintenant (dynamique) |
|---------|------------------|------------------------|
| Audits disponibles | ❌ 1 seul (Jalibat) | ✅ Tous les audits EL |
| Configuration | ❌ 242 modules fixe | ✅ N'importe quelle taille |
| Interface | ❌ Bouton direct | ✅ Modal de sélection |
| Prévisualisation | ❌ Aucune | ✅ Stats complètes |
| Flexibilité | ❌ Zéro | ✅ Totale |

---

## ✨ Résumé

**Vous pouvez maintenant importer N'IMPORTE QUELLE configuration d'audit EL !**

Plus besoin de hardcoder - le système est 100% dynamique et s'adapte automatiquement aux configurations réelles des audits Module EL.
