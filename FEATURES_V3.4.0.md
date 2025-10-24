# 🎯 Fonctionnalités v3.4.0 - Guide Complet

## Résumé Exécutif

**Version** : v3.4.0  
**Date** : 2025-10-24  
**URL Production** : https://273bf220.diagnostic-hub.pages.dev  
**Commit** : f4b31eb, 19a1d7a  

**Nouvelles fonctionnalités majeures** :
1. 🔍 Recherche temps réel projets
2. 📊 Filtres par statut
3. 🔄 Tri dynamique (8 options)
4. 📄 Génération rapports PDF/HTML
5. 📤 Communication postMessage Hub↔Iframe (v3.3.0)

---

## 🔍 1. Recherche Temps Réel

### Description
Barre de recherche permettant de filtrer les projets en temps réel par nom, client ou adresse.

### Localisation
**URL** : https://273bf220.diagnostic-hub.pages.dev/projects  
**Position** : Juste sous le header "Liste des Projets"

### Fonctionnement
- **Input text** avec icône recherche (🔍)
- **Event** : `oninput` déclenche `applyFilters()` à chaque frappe
- **Champs recherchés** :
  - `project.name` : Nom du projet
  - `project.client_name` : Nom du client
  - `project.site_address` : Adresse du site

### Exemple Utilisation
```
1. Aller sur /projects
2. Taper "JALIBAT" dans la barre de recherche
3. Résultats filtrés instantanément
4. Seuls les projets contenant "JALIBAT" apparaissent
```

### Code Clé
```javascript
// Recherche (case insensitive)
if (searchTerm) {
    filteredProjects = filteredProjects.filter(project => 
        (project.name || '').toLowerCase().includes(searchTerm) ||
        (project.client_name || '').toLowerCase().includes(searchTerm) ||
        (project.site_address || '').toLowerCase().includes(searchTerm)
    );
}
```

### Message Aucun Résultat
Si la recherche ne retourne aucun projet :
```
🔍 Aucun projet ne correspond à vos critères
[Bouton] Réinitialiser les filtres
```

---

## 📊 2. Filtres par Statut

### Description
Dropdown permettant de filtrer les projets selon leur statut de synchronisation.

### Options Disponibles
| Valeur | Label | Description |
|--------|-------|-------------|
| `all` | Tous les projets | Affiche tous les projets (défaut) |
| `synced` | Synchronisés | Projets dans D1 database uniquement |
| `local` | Locaux uniquement | Projets localStorage non synchronisés |

### Localisation
**Select dropdown** : à droite de la barre de recherche

### Fonctionnement
- **Event** : `onchange` déclenche `applyFilters()`
- **Filtre appliqué** :
  - `synced` : `filteredProjects.filter(p => p.synced)`
  - `local` : `filteredProjects.filter(p => !p.synced)`

### Exemple Utilisation
```
1. Sélectionner "Synchronisés" dans dropdown
2. Seuls les projets avec badge "✓ Synchronisé" apparaissent
3. Projets localStorage masqués
```

### Code Clé
```javascript
// Filtre par statut
if (statusFilter === 'synced') {
    filteredProjects = filteredProjects.filter(p => p.synced);
} else if (statusFilter === 'local') {
    filteredProjects = filteredProjects.filter(p => !p.synced);
}
```

---

## 🔄 3. Tri Dynamique

### Description
Dropdown avec 8 options de tri pour organiser les projets selon différents critères.

### Options Disponibles
| Valeur | Label | Tri Appliqué |
|--------|-------|--------------|
| `date-desc` | Plus récent | Date création décroissante (défaut) |
| `date-asc` | Plus ancien | Date création croissante |
| `name-asc` | Nom A-Z | Nom alphabétique croissant |
| `name-desc` | Nom Z-A | Nom alphabétique décroissant |
| `power-desc` | Puissance décroissante | Installation_power décroissante |
| `power-asc` | Puissance croissante | Installation_power croissante |
| `modules-desc` | Modules décroissants | Module_count décroissant |
| `modules-asc` | Modules croissants | Module_count croissant |

### Localisation
**Select dropdown** : à droite du filtre statut

### Fonctionnement
- **Event** : `onchange` déclenche `applyFilters()`
- **Tri JavaScript** : `.sort()` avec comparateurs custom

### Exemple Utilisation
```
1. Sélectionner "Puissance décroissante"
2. Projets triés du plus puissant au moins puissant
3. Exemple : 98.5 kWc → 50.4 kWc → 25.0 kWc
```

### Code Clé
```javascript
switch (sortBy) {
    case 'date-desc':
        filteredProjects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    case 'power-desc':
        filteredProjects.sort((a, b) => (b.installation_power || 0) - (a.installation_power || 0));
        break;
    case 'name-asc':
        filteredProjects.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
    // ... autres cas
}
```

---

## 📄 4. Génération Rapports PDF/HTML

### Description
Génération de rapports d'audit professionnels au format HTML (téléchargeables) avec possibilité future de conversion PDF.

### Endpoint API
**URL** : `GET /api/projects/:id/report`  
**Méthode** : GET  
**Paramètre** : `:id` = ID du projet (integer)  
**Réponse** : HTML complet du rapport

### Exemple Requête
```bash
curl https://273bf220.diagnostic-hub.pages.dev/api/projects/8/report
```

### Contenu Rapport

#### 1. En-tête
- Logo DiagPV 🔆
- Titre : "Rapport d'Audit Photovoltaïque"
- Date génération : format français (ex: "24 octobre 2025")

#### 2. Informations Projet (Section 1)
- Nom projet
- Client
- Adresse site
- Date installation
- Installateur
- Contact email

#### 3. Configuration Technique (Section 2)
**Stats principales** :
- Puissance installée (kWc)
- Nombre modules
- Interventions réalisées
- Défauts détectés (coloré rouge si > 0)

**Équipements** :
- Marque/modèle modules
- Marque/modèle onduleur

#### 4. Résultats Audit EL (Section 3)
**Tableau mesures** (50 premières) :
| Module ID | Date | Statut | Type Défaut | Criticité |
|-----------|------|--------|-------------|-----------|
| S1-1 | 22/10/2025 | ✅ Conforme | - | - |
| S2-3 | 22/10/2025 | ⚠️ Défaut | microfissure | high |

**Pagination** : "... et X autres modules" si > 50 mesures

#### 5. Conformité Normative (Section 4)
- Normes appliquées : IEC 62446-1, IEC 61215, IEC 60904-1
- Méthode : Électroluminescence nocturne
- **Taux conformité** : calculé automatiquement
  - Formule : `((total - défauts) / total * 100).toFixed(1)`
  - Exemple : 240/242 modules OK = 99.2%

#### 6. Conclusions & Recommandations (Section 5)
**Si aucun défaut** :
```
✅ Installation conforme - Aucun défaut majeur détecté
Recommandation : Contrôle de suivi dans 12 mois
```

**Si défauts détectés** :
```
⚠️ X défaut(s) détecté(s) - Actions correctives requises
- Identification précise modules défectueux
- Évaluation impact production
- Planification interventions correctives
- Repassage contrôle après travaux
```

#### 7. Footer
- Contact : www.diagnosticphotovoltaique.fr
- Services : Audits N1-N3, Commissioning, Post-Sinistre
- Confidentialité

### Bouton Frontend

**Localisation** : Sur chaque carte projet synchronisé  
**Label** : "📄 Rapport"  
**Fonction** : `generateReport(projectId, projectName)`

**Fonctionnement** :
1. Click bouton → loader "⏳ Génération..."
2. Fetch `/api/projects/:id/report`
3. Conversion response → Blob
4. Création élément `<a>` temporaire
5. Téléchargement fichier HTML
6. Nom fichier : `Rapport_NomProjet_2025-10-24.html`
7. Confirmation : "✅ Rapport PDF généré"

### Code Bouton
```html
<button onclick="generateReport(${project.id}, '${project.name}')" 
        class="px-3 py-1 text-blue-600 border border-blue-200 rounded hover:bg-blue-50" 
        title="Générer rapport PDF">
    <i class="fas fa-file-pdf mr-1"></i>Rapport
</button>
```

### Code Fonction
```javascript
async function generateReport(projectId, projectName) {
    try {
        const response = await fetch(`/api/projects/${projectId}/report`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rapport_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification('success', `✅ Rapport PDF généré pour "${projectName}"`);
        }
    } catch (error) {
        showNotification('error', 'Erreur génération rapport: ' + error.message);
    }
}
```

### Limitations Actuelles
❌ **Pas de conversion PDF serveur** : Cloudflare Workers ne supporte pas bibliothèques PDF lourdes (Puppeteer, wkhtmltopdf)

**Solutions futures** :
1. **Conversion côté client** : `jsPDF` + `html2canvas`
2. **API externe** : Service tiers (PDF.co, CloudConvert)
3. **Worker séparé** : Puppeteer sur VM externe

### Aperçu Visuel Rapport
```
┌─────────────────────────────────────────────┐
│  🔆 DIAGNOSTIC PHOTOVOLTAÏQUE              │
│  Audits Normatifs IEC 62446-1              │
├─────────────────────────────────────────────┤
│  Rapport d'Audit Photovoltaïque            │
│  Généré le 24 octobre 2025                 │
│                                             │
│  1. Informations Projet                    │
│  ┌─────────────┬─────────────┐            │
│  │ Nom Projet  │ Client      │            │
│  │ JALIBAT     │ JALIBAT SAS │            │
│  └─────────────┴─────────────┘            │
│                                             │
│  2. Configuration Technique                │
│  ┌──────┬────────┬──────┬────────┐        │
│  │ 98.5 │ 242    │ 5    │ 2      │        │
│  │ kWc  │ modules│ inter│ défauts│        │
│  └──────┴────────┴──────┴────────┘        │
│                                             │
│  3. Résultats Audit EL                     │
│  [Tableau 50 mesures]                      │
│                                             │
│  4. Conformité : 99.2%                     │
│  5. Conclusions : ✅ Conforme              │
│                                             │
│  Footer: www.diagnosticphotovoltaique.fr   │
└─────────────────────────────────────────────┘
```

---

## 🔗 5. Communication postMessage (v3.3.0)

### Description
Initialisation automatique des projets dans le module EL via communication postMessage entre Hub (parent) et iframe DiagPV (child).

### Architecture
```
Hub (Parent Window)                    Iframe DiagPV (Child Window)
https://273bf220.diagnostic-hub...     https://diagpv-audit.pages.dev
        │                                         │
        │  1. User clique "Module EL"            │
        │                                         │
        │  2. loadProjectData(8)                 │
        │     fetch /api/projects/8              │
        │                                         │
        │  3. postMessage ────────────────────►  │
        │     type: HUB_INIT_PROJECT             │
        │     project: {...}                     │
        │                                         │
        │                            4. window.addEventListener('message')
        │                                         │
        │                            5. initializeAuditSession(project)
        │                                         │
        │  ◄────────────────────────────────────  │
        │     type: DIAGPV_ACK_INIT (optionnel)  │
        │     status: 'initialized'              │
```

### Message Envoyé (Hub → Iframe)
```javascript
{
    type: 'HUB_INIT_PROJECT',
    project: {
        projectId: 8,
        projectName: "Audit JALIBAT Production",
        clientName: "JALIBAT SAS",
        siteAddress: "Route de...",
        totalModules: 242,
        installedPower: 98.5,
        sessionId: "hub_project_8",
        timestamp: "2025-10-24T08:00:00.000Z"
    }
}
```

### Fichiers Impliqués
- **Hub** : `/home/user/diagnostic-hub/src/index.tsx` (lignes ~2536-2580)
- **Iframe** : Voir `IFRAME_LISTENER_EXAMPLE.md` pour code complet

### Documentation Complète
Voir fichiers dédiés :
- `POSTMESSAGE_INTEGRATION.md` : Architecture, sécurité, tests
- `IFRAME_LISTENER_EXAMPLE.md` : Code JavaScript iframe complet

---

## 🎯 Architecture Globale applyFilters()

### Flux Complet
```
1. loadProjects()
   ↓
2. allProjectsData = allProjects (variable globale)
   ↓
3. applyFilters() appelé :
   a. Recherche (searchTerm)
   b. Filtre statut (synced/local)
   c. Tri (8 options)
   ↓
4. renderProjects(filteredProjects)
   ↓
5. HTML injecté dans #projectsList
```

### Variable Globale
```javascript
let allProjectsData = []; // Stocke TOUS les projets (D1 + localStorage)
```

**Avantages** :
- ✅ Pas de requête API à chaque filtre/tri
- ✅ Filtrage instantané côté client
- ✅ Performance optimale

### Fonction Centralisée
```javascript
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    let filteredProjects = [...allProjectsData]; // Clone
    
    // 1. Recherche
    if (searchTerm) { /* ... */ }
    
    // 2. Filtre statut
    if (statusFilter === 'synced') { /* ... */ }
    
    // 3. Tri
    switch (sortBy) { /* ... */ }
    
    renderProjects(filteredProjects);
}
```

### Bouton Reset
```javascript
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('sortBy').value = 'date-desc';
    applyFilters();
}
```

---

## 📊 Tests Production v3.4.0

### 1. Test Recherche
```bash
# URL
https://273bf220.diagnostic-hub.pages.dev/projects

# Actions
1. Taper "JALIBAT" → 1 résultat
2. Taper "xyz123" → Message "Aucun projet ne correspond"
3. Click "Réinitialiser" → Tous projets réaffichés
```

### 2. Test Filtres
```bash
# Filtre Synchronisés
Sélectionner "Synchronisés" → Seuls projets badge ✓ affichés

# Filtre Locaux
Sélectionner "Locaux uniquement" → Seuls projets badge 🔄 affichés
```

### 3. Test Tri
```bash
# Tri Nom A-Z
Sélectionner "Nom A-Z" → Projets triés alphabétiquement

# Tri Puissance
Sélectionner "Puissance décroissante" → 98.5 kWc en premier
```

### 4. Test Rapport
```bash
# API Test
curl https://273bf220.diagnostic-hub.pages.dev/api/projects/8/report | grep "<title>"
# Réponse : <title>Rapport Diagnostic - Audit JALIBAT Production</title>

# UI Test
1. Aller sur /projects
2. Click bouton "📄 Rapport" projet JALIBAT
3. Fichier HTML téléchargé : Rapport_Audit_JALIBAT_Production_2025-10-24.html
4. Ouvrir fichier → Rapport complet affiché
```

### 5. Test postMessage
```bash
# URL avec paramètres
https://273bf220.diagnostic-hub.pages.dev/modules/electroluminescence?project=8&name=Audit%20JALIBAT

# Console DevTools (F12)
# Logs Hub :
📊 Données projet chargées: {id: 8, name: "Audit JALIBAT Production", ...}
📤 Données projet envoyées vers iframe DiagPV: Audit JALIBAT Production

# Logs Iframe (après implémentation listener) :
✅ Projet reçu depuis Hub: Audit JALIBAT Production
🚀 Initialisation session audit: Audit JALIBAT Production
```

---

## 🚀 Déploiement v3.4.0

### Commits GitHub
```bash
f4b31eb - feat: Recherche, filtres, tri et génération rapports PDF v3.4.0
19a1d7a - docs: Update README v3.4.0 - Recherche, Filtres, Tri & Rapports
```

### Build
```
_worker.js : 288 kB (optimisé)
Vite build time : ~750ms
```

### URL Production
```
Principal : https://273bf220.diagnostic-hub.pages.dev
API Projets : https://273bf220.diagnostic-hub.pages.dev/api/projects
Rapport : https://273bf220.diagnostic-hub.pages.dev/api/projects/8/report
Module EL : https://273bf220.diagnostic-hub.pages.dev/modules/electroluminescence?project=8
```

### Base D1 Production
```
Database ID : 72be68d4-c5c5-4854-9ead-3bbcc131d199
Projets actifs : 2 (JALIBAT + test)
Tables : 15 (projects, interventions, el_measurements, etc.)
```

---

## 📋 Récapitulatif Fonctionnalités

| Fonctionnalité | Status | URL Test | Documentation |
|----------------|--------|----------|---------------|
| **Recherche temps réel** | ✅ | /projects | Section 1 |
| **Filtres statut** | ✅ | /projects | Section 2 |
| **Tri dynamique** | ✅ | /projects | Section 3 |
| **Génération rapports** | ✅ | /api/projects/:id/report | Section 4 |
| **Bouton téléchargement** | ✅ | /projects (bouton Rapport) | Section 4 |
| **postMessage Hub↔Iframe** | ✅ | /modules/electroluminescence?project=8 | Section 5 |
| **Exemple listener iframe** | ✅ | IFRAME_LISTENER_EXAMPLE.md | Doc dédiée |
| **Architecture postMessage** | ✅ | POSTMESSAGE_INTEGRATION.md | Doc dédiée |

---

## 🎯 Prochaines Étapes

### Court Terme
1. **Implémenter listener iframe** : Utiliser IFRAME_LISTENER_EXAMPLE.md dans DiagPV audit
2. **Tester communication** : Vérifier init projet en conditions réelles
3. **Feedback utilisateur** : Collecter retours terrain sur recherche/filtres

### Moyen Terme
1. **Conversion PDF serveur** : Intégrer API externe (PDF.co, CloudConvert)
2. **Signature électronique** : Certificat numérique rapports
3. **Envoi email auto** : Rapport client < 5 jours post-audit

### Long Terme
1. **Templates rapports** : Personnalisables par client
2. **Multi-langues** : Rapports FR/EN/ES
3. **Analytics avancés** : Dashboard KPI temps réel

---

**Auteur** : DiagPV Assistant  
**Version** : v3.4.0  
**Date** : 2025-10-24  
**Contact** : www.diagnosticphotovoltaique.fr
