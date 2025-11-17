-- Migration 0025: Unify clients → Use only crm_clients table
-- Date: 2025-11-17
-- Goal: Remove dual client tables, use single source of truth (crm_clients)

-- =============================================================================
-- PROBLÈME: Deux tables clients distinctes causent incohérence
--   • clients (simple) → utilisée par projects.client_id FK
--   • crm_clients (riche) → utilisée par el_audits.client_id FK
--   → Impossible de tracer Client → Projet → Intervention → Audit
--
-- SOLUTION: Supprimer clients, migrer projects vers crm_clients
-- =============================================================================

-- 1. Drop old simple clients table (should be empty anyway)
DROP TABLE IF EXISTS clients;

-- 2. Recreate projects table with FK to crm_clients
CREATE TABLE projects_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  site_address TEXT NOT NULL,
  installation_power REAL,
  inverter_model TEXT,
  module_model TEXT,
  installation_date DATE,
  commissioning_date DATE,
  string_count INTEGER,
  modules_per_string INTEGER,
  total_modules INTEGER,
  latitude REAL,
  longitude REAL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- NEW: FK to crm_clients instead of clients
  FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE CASCADE
);

-- 3. Copy existing data from old projects table (if any)
INSERT INTO projects_new 
SELECT * FROM projects;

-- 4. Drop old projects table
DROP TABLE projects;

-- 5. Rename new table
ALTER TABLE projects_new RENAME TO projects;

-- 6. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_site_address ON projects(site_address);

-- 7. Create unified workflow view for easy traceability
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

-- 8. Verification query (for testing after migration)
-- SELECT * FROM v_complete_workflow ORDER BY company_name, project_name;
