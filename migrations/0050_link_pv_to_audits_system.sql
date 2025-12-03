-- ============================================================================
-- Migration 0050 : Lier système PV Cartography à l'architecture unifiée audits
-- ============================================================================
-- Objectif : Créer liens bidirectionnels entre audits ↔ pv_zones/pv_plants
-- pour permettre synchronisation configuration et navigation fluide
--
-- Architecture cible :
--   audits (1) → pv_plants (0..N) → pv_zones (0..N) → pv_modules (0..N)
--   audits (1) → el_audits (0..1) → el_modules (0..N)
--
-- Cas d'usage :
--   1. Audit EL JALIBAT → Clic "PV CARTO" → Hérite config EL automatiquement
--   2. CRM Dashboard → Projet → Voir toutes centrales PV liées aux audits
--   3. Planning → Intervention → Audits → Cartographies PV associées
--   4. App terrain (futur) → Collaboration temps réel audit EL ↔ cartographie
--
-- Vision stratégique :
--   - Support multi-diagnostiqueurs (réseau national)
--   - SaaS API-first (accès tiers)
--   - Labels DiagPV/AFPA (certification centrale = somme audits)
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Ajouter colonnes de liaison dans pv_plants
-- ============================================================================

-- Lien vers audit master (optionnel - pour centrales créées depuis audit)
ALTER TABLE pv_plants ADD COLUMN audit_token TEXT;
ALTER TABLE pv_plants ADD COLUMN audit_id INTEGER REFERENCES audits(id) ON DELETE SET NULL;

-- Lien vers projet CRM (pour cohérence avec architecture)
ALTER TABLE pv_plants ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE pv_plants ADD COLUMN client_id INTEGER REFERENCES crm_clients(id) ON DELETE SET NULL;

-- Métadonnées synchronisation
ALTER TABLE pv_plants ADD COLUMN synced_from_el BOOLEAN DEFAULT 0;
ALTER TABLE pv_plants ADD COLUMN last_sync_at DATETIME;

-- Index performance
CREATE INDEX IF NOT EXISTS idx_pv_plants_audit_token ON pv_plants(audit_token);
CREATE INDEX IF NOT EXISTS idx_pv_plants_audit_id ON pv_plants(audit_id);
CREATE INDEX IF NOT EXISTS idx_pv_plants_project_id ON pv_plants(project_id);
CREATE INDEX IF NOT EXISTS idx_pv_plants_client_id ON pv_plants(client_id);

-- ============================================================================
-- ÉTAPE 2 : Ajouter colonnes de liaison dans pv_zones
-- ============================================================================

-- Lien vers audit master (optionnel - pour zones créées depuis audit)
ALTER TABLE pv_zones ADD COLUMN audit_token TEXT;
ALTER TABLE pv_zones ADD COLUMN audit_id INTEGER REFERENCES audits(id) ON DELETE SET NULL;

-- Configuration héritée (JSON - copie depuis audits.configuration_json)
ALTER TABLE pv_zones ADD COLUMN inherited_configuration TEXT;

-- Métadonnées synchronisation
ALTER TABLE pv_zones ADD COLUMN synced_from_el BOOLEAN DEFAULT 0;
ALTER TABLE pv_zones ADD COLUMN last_sync_at DATETIME;

-- Index performance
CREATE INDEX IF NOT EXISTS idx_pv_zones_audit_token ON pv_zones(audit_token);
CREATE INDEX IF NOT EXISTS idx_pv_zones_audit_id ON pv_zones(audit_id);

-- ============================================================================
-- ÉTAPE 3 : Ajouter colonnes de liaison dans pv_modules
-- ============================================================================

-- Lien vers module EL source (pour synchronisation statuts)
ALTER TABLE pv_modules ADD COLUMN el_module_id INTEGER REFERENCES el_modules(id) ON DELETE SET NULL;

-- Métadonnées synchronisation
ALTER TABLE pv_modules ADD COLUMN synced_from_el BOOLEAN DEFAULT 0;
ALTER TABLE pv_modules ADD COLUMN last_sync_at DATETIME;

-- Index performance
CREATE INDEX IF NOT EXISTS idx_pv_modules_el_module_id ON pv_modules(el_module_id);

-- ============================================================================
-- ÉTAPE 4 : Vue unifiée centrale PV (pour dashboard CRM)
-- ============================================================================

CREATE VIEW IF NOT EXISTS v_pv_plants_unified AS
SELECT 
  pp.id as plant_id,
  pp.plant_name,
  pp.plant_type,
  pp.address,
  pp.total_power_kwp,
  pp.audit_token,
  pp.audit_id,
  pp.project_id,
  pp.client_id,
  pp.synced_from_el,
  pp.last_sync_at,
  pp.created_at,
  pp.updated_at,
  
  -- Données audit lié
  a.project_name as audit_project_name,
  a.client_name as audit_client_name,
  a.location as audit_location,
  a.modules_enabled as audit_modules,
  a.status as audit_status,
  
  -- Données projet CRM
  p.project_name as project_name,
  p.module_count as project_module_count,
  
  -- Données client CRM
  c.company_name as client_company_name,
  c.email as client_email,
  
  -- Statistiques zones/modules
  (SELECT COUNT(*) FROM pv_zones WHERE plant_id = pp.id) as zone_count,
  (SELECT COUNT(*) FROM pv_modules pm JOIN pv_zones pz ON pm.zone_id = pz.id WHERE pz.plant_id = pp.id) as total_modules
  
FROM pv_plants pp
LEFT JOIN audits a ON pp.audit_id = a.id
LEFT JOIN projects p ON pp.project_id = p.id
LEFT JOIN crm_clients c ON pp.client_id = c.id;

-- ============================================================================
-- ÉTAPE 5 : Vue modules PV avec statuts EL synchronisés
-- ============================================================================

CREATE VIEW IF NOT EXISTS v_pv_modules_with_el_status AS
SELECT 
  pm.id as pv_module_id,
  pm.zone_id,
  pm.module_identifier,
  pm.pos_x_meters,
  pm.pos_y_meters,
  pm.rotation_degrees,
  pm.status as pv_status,
  pm.el_module_id,
  pm.synced_from_el,
  pm.last_sync_at,
  
  -- Zone info
  pz.zone_name,
  pz.plant_id,
  pz.audit_token as zone_audit_token,
  
  -- Plant info
  pp.plant_name,
  
  -- Statut EL synchronisé
  em.defect_type as el_defect_type,
  em.severity as el_severity,
  em.status as el_status,
  em.comment as el_comment,
  em.string_number as el_string_number,
  em.position_in_string as el_position,
  
  -- Audit EL lié
  ea.project_name as el_audit_project,
  ea.audit_token as el_audit_token

FROM pv_modules pm
JOIN pv_zones pz ON pm.zone_id = pz.id
JOIN pv_plants pp ON pz.plant_id = pp.id
LEFT JOIN el_modules em ON pm.el_module_id = em.id
LEFT JOIN el_audits ea ON em.audit_token = ea.audit_token;

-- ============================================================================
-- ÉTAPE 6 : Fonction helper pour copier configuration audit → pv_zone
-- ============================================================================

-- Note : SQLite ne supporte pas les fonctions stockées, donc cette logique
-- sera implémentée côté API (TypeScript), mais on documente le pattern ici
--
-- PATTERN API :
-- ```typescript
-- async function createPVZoneFromAudit(auditToken: string) {
--   // 1. Récupérer audit + configuration
--   const audit = await DB.prepare(
--     'SELECT * FROM audits WHERE audit_token = ?'
--   ).bind(auditToken).first()
--   
--   // 2. Créer pv_plant si n'existe pas
--   const plantId = await createOrGetPVPlant({
--     plant_name: audit.project_name,
--     address: audit.location,
--     audit_token: auditToken,
--     audit_id: audit.id,
--     project_id: audit.project_id,
--     client_id: audit.client_id,
--     synced_from_el: true
--   })
--   
--   // 3. Créer pv_zone avec configuration héritée
--   const zoneId = await DB.prepare(`
--     INSERT INTO pv_zones (
--       plant_id, zone_name, audit_token, audit_id,
--       inherited_configuration, synced_from_el, last_sync_at
--     ) VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
--   `).bind(
--     plantId, 
--     audit.project_name + ' - Zone 1',
--     auditToken,
--     audit.id,
--     audit.configuration_json
--   ).run()
--   
--   // 4. Synchroniser modules EL → PV
--   await syncELModulesToPV(auditToken, zoneId)
-- }
-- ```

-- ============================================================================
-- ÉTAPE 7 : Mise à jour liens existants (si données déjà présentes)
-- ============================================================================

-- Tenter de lier centrales PV existantes aux audits via nom projet
UPDATE pv_plants
SET audit_token = (
  SELECT ea.audit_token 
  FROM el_audits ea 
  WHERE LOWER(ea.project_name) = LOWER(pv_plants.plant_name)
  LIMIT 1
)
WHERE audit_token IS NULL
  AND EXISTS (
    SELECT 1 FROM el_audits ea 
    WHERE LOWER(ea.project_name) = LOWER(pv_plants.plant_name)
  );

-- Mettre à jour audit_id basé sur audit_token
UPDATE pv_plants
SET audit_id = (
  SELECT id FROM audits WHERE audit_token = pv_plants.audit_token
)
WHERE audit_token IS NOT NULL AND audit_id IS NULL;

-- Propager audit_token aux zones
UPDATE pv_zones
SET audit_token = (
  SELECT pp.audit_token FROM pv_plants pp WHERE pp.id = pv_zones.plant_id
)
WHERE audit_token IS NULL
  AND EXISTS (
    SELECT 1 FROM pv_plants pp 
    WHERE pp.id = pv_zones.plant_id AND pp.audit_token IS NOT NULL
  );

-- ============================================================================
-- ÉTAPE 8 : Documentation pattern multi-diagnostiqueurs (futur)
-- ============================================================================

-- Note : Pour app terrain multi-utilisateur temps réel, ajouter ces colonnes :
--
-- ALTER TABLE audits ADD COLUMN assigned_diagnostiqueurs TEXT; -- JSON array [1,5,12]
-- ALTER TABLE audits ADD COLUMN collaboration_mode TEXT; -- 'solo' | 'team' | 'peer_review'
-- ALTER TABLE el_modules ADD COLUMN last_modified_by INTEGER REFERENCES diagnostiqueurs(id);
-- ALTER TABLE el_modules ADD COLUMN locked_by INTEGER REFERENCES diagnostiqueurs(id);
-- ALTER TABLE el_modules ADD COLUMN locked_at DATETIME;
--
-- CREATE TABLE audit_activity_log (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   audit_token TEXT NOT NULL,
--   diagnostiqueur_id INTEGER,
--   action_type TEXT, -- 'module_updated', 'status_changed', 'photo_uploaded'
--   action_data TEXT, -- JSON
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

-- ============================================================================
-- ÉTAPE 9 : Documentation pattern labels/certification (futur)
-- ============================================================================

-- Note : Pour labels DiagPV/AFPA, lier centrales aux certifications :
--
-- ALTER TABLE pv_plants ADD COLUMN certification_status TEXT; -- 'pending' | 'certified' | 'rejected'
-- ALTER TABLE pv_plants ADD COLUMN certification_date DATE;
-- ALTER TABLE pv_plants ADD COLUMN certification_label TEXT; -- 'DiagPV Certified' | 'AFPA Level 1'
-- ALTER TABLE pv_plants ADD COLUMN certification_score INTEGER; -- 0-100
--
-- CREATE TABLE plant_certification_audits (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   plant_id INTEGER REFERENCES pv_plants(id),
--   audit_token TEXT REFERENCES audits(audit_token),
--   contributes_to_certification BOOLEAN DEFAULT 1,
--   audit_weight REAL, -- Pondération audit (EL = 40%, IV = 30%, etc.)
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

-- ============================================================================
-- FIN MIGRATION 0050
-- ============================================================================

-- Résumé des changements :
-- ✅ pv_plants : +6 colonnes (audit_token, audit_id, project_id, client_id, synced_from_el, last_sync_at)
-- ✅ pv_zones : +5 colonnes (audit_token, audit_id, inherited_configuration, synced_from_el, last_sync_at)
-- ✅ pv_modules : +3 colonnes (el_module_id, synced_from_el, last_sync_at)
-- ✅ 2 vues unifiées : v_pv_plants_unified, v_pv_modules_with_el_status
-- ✅ 8 index performance
-- ✅ Liens automatiques données existantes
-- ✅ Documentation patterns futurs (multi-user, labels, certification)
