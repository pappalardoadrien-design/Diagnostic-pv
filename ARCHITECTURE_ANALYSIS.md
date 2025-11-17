# 📊 ANALYSE COMPLÈTE ARCHITECTURE BASE DE DONNÉES - DiagPV CRM

**Date** : 2025-11-17  
**Statut** : 🔴 PROBLÈMES CRITIQUES IDENTIFIÉS

---

## 🚨 PROBLÈMES CRITIQUES

### 1. **DUALITÉ TABLES CLIENTS** (Problème majeur)

**Situation actuelle** :
```
clients (simple)              crm_clients (CRM riche)
├─ id                         ├─ id
├─ name                       ├─ company_name
├─ contact_email              ├─ main_contact_email
├─ contact_phone              ├─ main_contact_phone
├─ address                    ├─ address, postal_code, city
├─ siret                      ├─ siret, tva_number
└─ notes                      ├─ client_type, status
                              ├─ acquisition_source
                              └─ assigned_to (FK → auth_users)
```

**Problème** :
- `projects.client_id` → FK vers `clients.id` (table simple VIDE)
- `el_audits.client_id` → FK vers `crm_clients.id` (table riche UTILISÉE)
- **Incohérence** : Les projets et audits ne peuvent pas être liés au même client

**Impact** :
- ❌ **Impossible de créer un projet** car `clients` est vide
- ❌ **Cascade de blocage** : Sans projet, pas d'intervention, pas d'audit lié

---

### 2. **LIENS INTERVENTION ↔ AUDIT MANQUANTS**

**Situation actuelle** :
```sql
-- el_audits table
CREATE TABLE el_audits (
  id INTEGER PRIMARY KEY,
  intervention_id INTEGER,  -- ✅ COLONNE EXISTE
  client_id INTEGER REFERENCES crm_clients(id),  -- ✅ FK EXISTE
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  ...
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE SET NULL
);
```

**Status** : ✅ La FK `intervention_id` existe déjà dans `el_audits`

**Problème actuel** :
- Les audits créés manuellement n'ont pas `intervention_id` renseigné
- Impossible de tracer Client → Projet → Intervention → Audit

---

## 🎯 ARCHITECTURE CIBLE (Correcte)

### Flux de données correct :

```
crm_clients (Table unique pour tous les clients)
    ↓ (FK: projects.client_id)
projects (Projets liés aux clients CRM)
    ↓ (FK: interventions.project_id)
interventions (Interventions planifiées avec ou sans technicien)
    ↓ (FK: el_audits.intervention_id)
el_audits (Audits EL liés aux interventions)
    ↓ (FK: el_modules.el_audit_id)
el_modules (Modules diagnostiqués)
```

### Relations complètes :

| Table | Foreign Key | Référence | Action |
|-------|-------------|-----------|--------|
| `projects` | `client_id` | `crm_clients(id)` | CASCADE |
| `interventions` | `project_id` | `projects(id)` | CASCADE |
| `interventions` | `technician_id` | `auth_users(id)` | SET NULL |
| `el_audits` | `client_id` | `crm_clients(id)` | SET NULL |
| `el_audits` | `intervention_id` | `interventions(id)` | SET NULL |
| `el_modules` | `el_audit_id` | `el_audits(id)` | CASCADE |

---

## ✅ SOLUTIONS À IMPLÉMENTER

### Solution 1 : **Supprimer la table `clients` et utiliser uniquement `crm_clients`**

**Migration 0025** :
```sql
-- 1. Supprimer la contrainte FK projects.client_id → clients.id
-- 2. Supprimer la table clients
DROP TABLE IF EXISTS clients;

-- 3. Recréer la table projects avec FK vers crm_clients
CREATE TABLE projects_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  site_address TEXT NOT NULL,
  ...
  FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE CASCADE
);

-- 4. Copier les données (si existantes)
INSERT INTO projects_new SELECT * FROM projects;

-- 5. Remplacer la table
DROP TABLE projects;
ALTER TABLE projects_new RENAME TO projects;

-- 6. Recréer les indexes
CREATE INDEX idx_projects_client ON projects(client_id);
```

**Avantages** :
- ✅ Une seule source de vérité pour les clients
- ✅ Données riches CRM disponibles partout (SIRET, TVA, assigned_to, etc.)
- ✅ Cohérence garantie entre tous les modules
- ✅ Traçabilité complète Client → Projet → Intervention → Audit

---

### Solution 2 : **Lier automatiquement les audits aux interventions**

**Modification API** : Lors de la création d'un audit EL, si une intervention existe pour ce projet :

```typescript
// Dans src/modules/el/routes.ts
app.post('/api/el/audit/create', async (c) => {
  const { projectName, clientName, date, ... } = await c.req.json();
  
  // 1. Trouver le client CRM
  const client = await DB.prepare(`
    SELECT id FROM crm_clients WHERE company_name = ?
  `).bind(clientName).first();
  
  // 2. Trouver l'intervention associée (si existe)
  const intervention = await DB.prepare(`
    SELECT i.id 
    FROM interventions i
    JOIN projects p ON p.id = i.project_id
    JOIN crm_clients c ON c.id = p.client_id
    WHERE c.company_name = ? 
      AND p.name = ?
      AND i.intervention_type = 'el_audit'
      AND i.intervention_date <= ?
      AND i.status IN ('scheduled', 'in_progress')
    ORDER BY i.intervention_date DESC
    LIMIT 1
  `).bind(clientName, projectName, date).first();
  
  // 3. Créer l'audit avec les liens
  const result = await DB.prepare(`
    INSERT INTO el_audits (
      client_id, intervention_id, audit_token, project_name, client_name, ...
    ) VALUES (?, ?, ?, ?, ?, ...)
  `).bind(
    client?.id || null,
    intervention?.id || null,
    auditToken,
    projectName,
    clientName,
    ...
  ).run();
});
```

---

## 📋 PLAN D'ACTION IMMÉDIAT

### Phase 1 : Correction structure (PRIORITAIRE)

1. ✅ **Migration 0025** : Supprimer `clients`, utiliser uniquement `crm_clients`
2. ✅ **Recréer données de test complètes** :
   - 3 clients CRM
   - 5 projets (liés à crm_clients)
   - 11 interventions (variées)
   - 3 audits EL (avec intervention_id)

### Phase 2 : Vérification cohérence

1. ✅ **Test traçabilité complète** :
   ```sql
   SELECT 
     cc.company_name as "Client",
     p.name as "Projet",
     i.intervention_type as "Type",
     i.intervention_date as "Date",
     a.project_name as "Audit",
     a.status as "Statut"
   FROM crm_clients cc
   LEFT JOIN projects p ON p.client_id = cc.id
   LEFT JOIN interventions i ON i.project_id = p.id
   LEFT JOIN el_audits a ON a.intervention_id = i.id
   ORDER BY cc.company_name, p.name;
   ```

2. ✅ **Test génération rapport complet** :
   - Marquer des modules comme défectueux
   - Générer PDF avec toutes les infos liées

### Phase 3 : Optimisation

1. ✅ **Créer view matérialisée** pour traçabilité :
   ```sql
   CREATE VIEW v_complete_workflow AS
   SELECT 
     cc.id as client_id,
     cc.company_name,
     cc.siret,
     p.id as project_id,
     p.name as project_name,
     p.site_address,
     p.installation_power,
     i.id as intervention_id,
     i.intervention_type,
     i.intervention_date,
     i.status as intervention_status,
     u.email as technician_email,
     a.id as audit_id,
     a.audit_token,
     a.status as audit_status,
     a.total_modules,
     COUNT(DISTINCT m.id) as modules_diagnosed
   FROM crm_clients cc
   LEFT JOIN projects p ON p.client_id = cc.id
   LEFT JOIN interventions i ON i.project_id = p.id
   LEFT JOIN auth_users u ON u.id = i.technician_id
   LEFT JOIN el_audits a ON a.intervention_id = i.id
   LEFT JOIN el_modules m ON m.el_audit_id = a.id
   GROUP BY cc.id, p.id, i.id, a.id;
   ```

---

## 🎯 COMPATIBILITÉ VISION GLOBALE

### ✅ Modules implémentés (Phase 1 - Semaines 1-12)

| Module | Statut | Compatibilité | Notes |
|--------|--------|---------------|-------|
| **Authentication** | ✅ | 100% | Multi-role OK |
| **CRM Clients** | ✅ | 100% | Table riche complète |
| **Projets** | ⚠️ | 85% | Besoin migration FK |
| **Planning** | ✅ | 95% | Interventions OK, besoin lien audit |
| **Module EL** | ✅ | 90% | Besoin lien intervention_id |
| **Rapports PDF** | ✅ | 100% | pdfkit prêt |

### 🔜 Modules futurs (Phase 2-8)

| Phase | Module | Dépendance actuelle |
|-------|--------|---------------------|
| **Phase 2** | Modélisation 3D | ✅ el_modules (row/col OK) |
| **Phase 3** | App Mobile | ✅ API REST complète |
| **Phase 4** | IA Analyse | ✅ el_modules (defect_type) |
| **Phase 5** | Portail Client | ✅ auth_users (role='client') |
| **Phase 6** | Hub sous-traitants | ✅ auth_users (role='subcontractor') |
| **Phase 7** | Facturation | ⚠️ Besoin migration CRM |
| **Phase 8** | Analytics | ✅ Base solide |

---

## 🚀 RECOMMANDATIONS FINALES

### Priorité HAUTE 🔴

1. **Implémenter Migration 0025** (supprimer table `clients`)
2. **Recréer données de test complètes** avec FK correctes
3. **Modifier API audit creation** pour auto-lier intervention_id

### Priorité MOYENNE 🟡

4. **Créer view v_complete_workflow** pour traçabilité
5. **Ajouter tests E2E** du workflow complet
6. **Documentation** des relations dans README.md

### Priorité BASSE 🟢

7. **Optimiser requêtes** avec indexes composites
8. **Ajouter triggers** pour auto-update timestamps
9. **Monitoring** santé des relations FK

---

## ✅ CONCLUSION

**État actuel** : 🟡 **Architecture 85% correcte, besoin migration critique**

**Problèmes bloquants** :
- ❌ Dualité `clients` / `crm_clients` bloque création projets
- ❌ Pas de données de test complètes

**Solutions claires** :
- ✅ Migration 0025 : Table unique `crm_clients`
- ✅ Script automatisé de création données test
- ✅ Lien auto intervention_id dans audits

**Compatibilité future** : 95% ✅
- Architecture modulaire solide
- Relations FK bien pensées
- Prêt pour Phases 2-8 après migration

---

**Prochaine action** : Implémenter Migration 0025 et recréer données de test complètes.
