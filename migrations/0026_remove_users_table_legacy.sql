-- Migration 0026: Remove legacy users table and migrate FK to auth_users
-- Date: 2025-11-17
-- Goal: Clean architecture - single user table (auth_users)

-- =============================================================================
-- PROBLÈME: Deux tables utilisateurs (auth_users + users)
--   • auth_users: Table correcte avec authentification complète
--   • users: Table legacy obsolète, mais FK dans el_modules et el_collaborative_sessions
--
-- SOLUTION: Migrer toutes les FK vers auth_users et supprimer users
-- =============================================================================

-- 0. DROP views qui dépendent de el_modules
DROP VIEW IF EXISTS v_el_audit_statistics;
DROP VIEW IF EXISTS v_complete_workflow;

-- 1. Recréer el_modules avec FK vers auth_users
CREATE TABLE el_modules_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  el_audit_id INTEGER NOT NULL,
  audit_token TEXT NOT NULL,
  module_identifier TEXT NOT NULL,
  string_number INTEGER NOT NULL,
  position_in_string INTEGER NOT NULL,
  defect_type TEXT DEFAULT 'pending',
  severity_level INTEGER DEFAULT 0,
  comment TEXT,
  technician_id INTEGER,
  physical_row INTEGER,
  physical_col INTEGER,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- NEW: FK vers auth_users au lieu de users
  FOREIGN KEY (el_audit_id) REFERENCES el_audits(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES auth_users(id) ON DELETE SET NULL,
  UNIQUE(el_audit_id, module_identifier)
);

-- 2. Copier toutes les données existantes
INSERT INTO el_modules_new 
SELECT * FROM el_modules;

-- 3. Drop old table
DROP TABLE el_modules;

-- 4. Rename new table
ALTER TABLE el_modules_new RENAME TO el_modules;

-- 5. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_el_modules_audit ON el_modules(el_audit_id);
CREATE INDEX IF NOT EXISTS idx_el_modules_token ON el_modules(audit_token);
CREATE INDEX IF NOT EXISTS idx_el_modules_string ON el_modules(string_number);
CREATE INDEX IF NOT EXISTS idx_el_modules_defect ON el_modules(defect_type);

-- 6. Recréer el_collaborative_sessions avec FK vers auth_users
CREATE TABLE el_collaborative_sessions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  technician_id INTEGER NOT NULL,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  cursor_position TEXT,
  
  -- NEW: FK vers auth_users au lieu de users
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

-- 7. Copier données existantes (si existantes)
INSERT INTO el_collaborative_sessions_new 
SELECT * FROM el_collaborative_sessions;

-- 8. Drop old table
DROP TABLE el_collaborative_sessions;

-- 9. Rename new table
ALTER TABLE el_collaborative_sessions_new RENAME TO el_collaborative_sessions;

-- 10. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_collab_sessions_token ON el_collaborative_sessions(audit_token);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_tech ON el_collaborative_sessions(technician_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_active ON el_collaborative_sessions(is_active);

-- 11. DROP legacy users table (maintenant inutilisée)
DROP TABLE IF EXISTS users;

-- =============================================================================
-- 12. RECREATE VIEWS (after all table changes)
-- =============================================================================

-- Recreate v_complete_workflow (workflow complet CRM → Audit → Modules)
CREATE VIEW IF NOT EXISTS v_complete_workflow AS
SELECT 
  -- Client CRM info
  cc.id as client_id,
  cc.company_name,
  cc.siret,
  cc.main_contact_name,
  cc.main_contact_email,
  cc.main_contact_phone,
  cc.status as client_status,
  
  -- Project info
  p.id as project_id,
  p.name as project_name,
  p.site_address,
  p.installation_power,
  p.total_modules as project_total_modules,
  
  -- Intervention info
  i.id as intervention_id,
  i.intervention_type,
  i.intervention_date,
  i.duration_hours,
  i.status as intervention_status,
  
  -- Technician info
  u.id as technician_id,
  u.email as technician_email,
  
  -- Audit EL info
  a.id as audit_id,
  a.audit_token,
  a.status as audit_status,
  a.total_modules as audit_total_modules,
  a.completion_rate,
  
  -- Module stats
  COUNT(DISTINCT m.id) as modules_diagnosed,
  SUM(CASE WHEN m.defect_type = 'ok' THEN 1 ELSE 0 END) as modules_ok,
  SUM(CASE WHEN m.defect_type = 'microfissure' THEN 1 ELSE 0 END) as modules_microfissure,
  SUM(CASE WHEN m.defect_type = 'dead' THEN 1 ELSE 0 END) as modules_dead,
  SUM(CASE WHEN m.defect_type = 'string_open' THEN 1 ELSE 0 END) as modules_string_open,
  SUM(CASE WHEN m.defect_type = 'not_connected' THEN 1 ELSE 0 END) as modules_not_connected,
  SUM(CASE WHEN m.defect_type = 'inequality' THEN 1 ELSE 0 END) as modules_inequality

FROM crm_clients cc
LEFT JOIN projects p ON p.client_id = cc.id
LEFT JOIN interventions i ON i.project_id = p.id
LEFT JOIN auth_users u ON u.id = i.technician_id
LEFT JOIN el_audits a ON a.intervention_id = i.id
LEFT JOIN el_modules m ON m.el_audit_id = a.id

GROUP BY cc.id, p.id, i.id, a.id;

-- Recreate v_el_audit_statistics (statistiques module EL)
CREATE VIEW IF NOT EXISTS v_el_audit_statistics AS
SELECT 
  ea.id AS audit_id,
  ea.audit_token,
  ea.project_name,
  ea.client_name,
  ea.total_modules,
  ea.completion_rate,
  ea.status,
  COUNT(em.id) AS modules_diagnosed,
  SUM(CASE WHEN em.defect_type = 'none' THEN 1 ELSE 0 END) AS modules_ok,
  SUM(CASE WHEN em.defect_type = 'microcrack' THEN 1 ELSE 0 END) AS modules_microcrack,
  SUM(CASE WHEN em.defect_type = 'dead_module' THEN 1 ELSE 0 END) AS modules_dead,
  SUM(CASE WHEN em.defect_type = 'luminescence_inequality' THEN 1 ELSE 0 END) AS modules_inequality,
  SUM(CASE WHEN em.severity_level >= 2 THEN 1 ELSE 0 END) AS modules_critical,
  ea.created_at,
  ea.updated_at
FROM el_audits ea
LEFT JOIN el_modules em ON ea.id = em.el_audit_id
GROUP BY ea.id;

-- 13. Vérification finale - compter les FK vers auth_users
-- SELECT COUNT(*) as el_modules_count FROM el_modules WHERE technician_id IS NOT NULL;
-- SELECT COUNT(*) as sessions_count FROM el_collaborative_sessions;
