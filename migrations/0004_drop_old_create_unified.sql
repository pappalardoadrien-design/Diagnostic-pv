-- ============================================================================
-- MIGRATION 0004: Suppression anciennes tables + Création schéma unifié clean
-- ============================================================================
-- Cette migration supprime les tables de l'ancien schéma Module EL standalone
-- et crée le schéma unifié complet depuis zéro.
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: SUPPRESSION ANCIEN SCHÉMA
-- ============================================================================

-- Supprimer les triggers d'abord
DROP TRIGGER IF EXISTS update_el_audit_completion_rate;
DROP TRIGGER IF EXISTS update_el_modules_timestamp;
DROP TRIGGER IF EXISTS update_el_audits_timestamp;
DROP TRIGGER IF EXISTS update_interventions_timestamp;
DROP TRIGGER IF EXISTS update_projects_timestamp;
DROP TRIGGER IF EXISTS update_clients_timestamp;
DROP TRIGGER IF EXISTS update_users_timestamp;

-- Supprimer les vues
DROP VIEW IF EXISTS v_dashboard_overview;
DROP VIEW IF EXISTS v_el_audit_statistics;

-- Supprimer les index
DROP INDEX IF EXISTS idx_sessions_active;
DROP INDEX IF EXISTS idx_sessions_audit;
DROP INDEX IF EXISTS idx_pvserv_audit;
DROP INDEX IF EXISTS idx_audits_created;
DROP INDEX IF EXISTS idx_audits_token;
DROP INDEX IF EXISTS idx_modules_status;
DROP INDEX IF EXISTS idx_modules_string;
DROP INDEX IF EXISTS idx_modules_audit_token;

-- Supprimer les anciennes tables (ordre inverse des dépendances)
DROP TABLE IF EXISTS pvserv_measurements;
DROP TABLE IF EXISTS collaborative_sessions;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS audits;

-- Supprimer tables créées par migration 0003 si partiellement appliquée
DROP TABLE IF EXISTS el_collaborative_sessions;
DROP TABLE IF EXISTS el_modules;
DROP TABLE IF EXISTS el_audits;
DROP TABLE IF EXISTS post_incident_expertise;
DROP TABLE IF EXISTS visual_inspections;
DROP TABLE IF EXISTS isolation_tests;
DROP TABLE IF EXISTS thermal_measurements;
DROP TABLE IF EXISTS iv_measurements;
DROP TABLE IF EXISTS interventions;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS users;

-- ============================================================================
-- ÉTAPE 2: CRÉATION SCHÉMA UNIFIÉ (repris de 0003)
-- ============================================================================

-- Tables CORE
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'technician',
  certification_level TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  siret TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
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
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE interventions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  technician_id INTEGER NOT NULL,
  intervention_type TEXT NOT NULL,
  intervention_date DATE NOT NULL,
  duration_hours REAL,
  status TEXT DEFAULT 'scheduled',
  weather_conditions TEXT,
  temperature_ambient REAL,
  irradiance REAL,
  notes TEXT,
  report_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- Module EL
CREATE TABLE el_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER,
  audit_token TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT,
  string_count INTEGER NOT NULL,
  modules_per_string INTEGER NOT NULL,
  total_modules INTEGER NOT NULL,
  configuration_json TEXT,
  plan_file_url TEXT,
  status TEXT DEFAULT 'created',
  completion_rate REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE SET NULL
);

CREATE TABLE el_modules (
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
  FOREIGN KEY (el_audit_id) REFERENCES el_audits(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id),
  UNIQUE(el_audit_id, module_identifier)
);

CREATE TABLE el_collaborative_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  technician_id INTEGER NOT NULL,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  cursor_position TEXT,
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- Modules futurs (tables vides prêtes)
CREATE TABLE iv_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  string_number INTEGER,
  module_number INTEGER,
  measurement_type TEXT NOT NULL,
  isc REAL,
  voc REAL,
  pmax REAL,
  impp REAL,
  vmpp REAL,
  fill_factor REAL,
  irradiance REAL,
  temperature_module REAL,
  temperature_ambient REAL,
  iv_curve_data TEXT,
  pmax_stc_corrected REAL,
  deviation_from_datasheet REAL,
  rs REAL,
  rsh REAL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
);

CREATE TABLE thermal_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  measurement_method TEXT NOT NULL,
  temperature_max REAL,
  temperature_min REAL,
  temperature_avg REAL,
  delta_t_max REAL,
  string_number INTEGER,
  module_number INTEGER,
  gps_latitude REAL,
  gps_longitude REAL,
  thermal_image_url TEXT,
  thermal_map_url TEXT,
  visible_image_url TEXT,
  defect_type TEXT,
  severity_level INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
);

CREATE TABLE isolation_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  test_type TEXT NOT NULL,
  test_voltage REAL,
  resistance_value REAL,
  pass_threshold REAL,
  test_result TEXT NOT NULL,
  string_number INTEGER,
  measurement_point TEXT,
  compliance_standard TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
);

CREATE TABLE visual_inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  inspection_type TEXT NOT NULL,
  string_number INTEGER,
  module_number INTEGER,
  location_description TEXT,
  defect_found BOOLEAN DEFAULT 0,
  defect_type TEXT,
  severity_level INTEGER,
  photo_url TEXT,
  gps_latitude REAL,
  gps_longitude REAL,
  corrective_action_required BOOLEAN DEFAULT 0,
  corrective_action_description TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
);

CREATE TABLE post_incident_expertise (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  incident_date DATE NOT NULL,
  incident_type TEXT NOT NULL,
  root_cause TEXT,
  contributing_factors TEXT,
  affected_modules_count INTEGER,
  affected_strings_count INTEGER,
  estimated_power_loss_kw REAL,
  estimated_production_loss_kwh_year REAL,
  estimated_financial_loss_eur REAL,
  incident_photos_urls TEXT,
  insurance_report_url TEXT,
  expert_report_url TEXT,
  safety_hazard BOOLEAN DEFAULT 0,
  immediate_actions_required TEXT,
  repair_recommendations TEXT,
  prevention_recommendations TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
);

-- Table PVserv (compatibilité)
CREATE TABLE pvserv_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER,
  audit_token TEXT,
  string_number INTEGER,
  module_number INTEGER,
  ff REAL,
  rds REAL,
  uf REAL,
  measurement_type TEXT,
  iv_curve_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE SET NULL
);

-- ============================================================================
-- ÉTAPE 3: INDEX
-- ============================================================================

-- Index tables CORE
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_interventions_project ON interventions(project_id);
CREATE INDEX idx_interventions_technician ON interventions(technician_id);
CREATE INDEX idx_interventions_type ON interventions(intervention_type);
CREATE INDEX idx_interventions_date ON interventions(intervention_date);

-- Index Module EL
CREATE INDEX idx_el_audits_token ON el_audits(audit_token);
CREATE INDEX idx_el_audits_intervention ON el_audits(intervention_id);
CREATE INDEX idx_el_audits_status ON el_audits(status);
CREATE INDEX idx_el_audits_created ON el_audits(created_at);
CREATE INDEX idx_el_modules_audit_id ON el_modules(el_audit_id);
CREATE INDEX idx_el_modules_audit_token ON el_modules(audit_token);
CREATE INDEX idx_el_modules_string ON el_modules(string_number);
CREATE INDEX idx_el_modules_defect ON el_modules(defect_type);
CREATE INDEX idx_el_modules_severity ON el_modules(severity_level);
CREATE INDEX idx_el_sessions_audit ON el_collaborative_sessions(audit_token);
CREATE INDEX idx_el_sessions_active ON el_collaborative_sessions(is_active);

-- Index autres modules
CREATE INDEX idx_iv_intervention ON iv_measurements(intervention_id);
CREATE INDEX idx_iv_string ON iv_measurements(string_number);
CREATE INDEX idx_thermal_intervention ON thermal_measurements(intervention_id);
CREATE INDEX idx_thermal_defect ON thermal_measurements(defect_type);
CREATE INDEX idx_thermal_severity ON thermal_measurements(severity_level);
CREATE INDEX idx_isolation_intervention ON isolation_tests(intervention_id);
CREATE INDEX idx_isolation_result ON isolation_tests(test_result);
CREATE INDEX idx_visual_intervention ON visual_inspections(intervention_id);
CREATE INDEX idx_visual_defect_found ON visual_inspections(defect_found);
CREATE INDEX idx_visual_severity ON visual_inspections(severity_level);
CREATE INDEX idx_expertise_intervention ON post_incident_expertise(intervention_id);
CREATE INDEX idx_expertise_incident_type ON post_incident_expertise(incident_type);
CREATE INDEX idx_expertise_incident_date ON post_incident_expertise(incident_date);
CREATE INDEX idx_pvserv_intervention ON pvserv_measurements(intervention_id);
CREATE INDEX idx_pvserv_audit_token ON pvserv_measurements(audit_token);

-- ============================================================================
-- ÉTAPE 4: TRIGGERS
-- ============================================================================

CREATE TRIGGER update_users_timestamp 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_clients_timestamp 
AFTER UPDATE ON clients
BEGIN
  UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_projects_timestamp 
AFTER UPDATE ON projects
BEGIN
  UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_interventions_timestamp 
AFTER UPDATE ON interventions
BEGIN
  UPDATE interventions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_el_audits_timestamp 
AFTER UPDATE ON el_audits
BEGIN
  UPDATE el_audits SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_el_modules_timestamp 
AFTER UPDATE ON el_modules
BEGIN
  UPDATE el_modules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_el_audit_completion_rate
AFTER UPDATE OF defect_type ON el_modules
BEGIN
  UPDATE el_audits 
  SET completion_rate = (
    SELECT CAST(COUNT(*) AS REAL) * 100.0 / (
      SELECT total_modules FROM el_audits WHERE id = NEW.el_audit_id
    )
    FROM el_modules 
    WHERE el_audit_id = NEW.el_audit_id 
    AND defect_type != 'pending'
  )
  WHERE id = NEW.el_audit_id;
END;

-- ============================================================================
-- ÉTAPE 5: VUES
-- ============================================================================

CREATE VIEW v_el_audit_statistics AS
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

CREATE VIEW v_dashboard_overview AS
SELECT 
  p.id AS project_id,
  p.name AS project_name,
  c.name AS client_name,
  p.installation_power,
  p.total_modules,
  COUNT(DISTINCT i.id) AS total_interventions,
  SUM(CASE WHEN i.intervention_type = 'el' THEN 1 ELSE 0 END) AS interventions_el,
  SUM(CASE WHEN i.intervention_type = 'iv' THEN 1 ELSE 0 END) AS interventions_iv,
  SUM(CASE WHEN i.intervention_type = 'thermique' THEN 1 ELSE 0 END) AS interventions_thermique,
  SUM(CASE WHEN i.intervention_type = 'isolation' THEN 1 ELSE 0 END) AS interventions_isolation,
  SUM(CASE WHEN i.intervention_type = 'visuels' THEN 1 ELSE 0 END) AS interventions_visuels,
  SUM(CASE WHEN i.intervention_type = 'expertise' THEN 1 ELSE 0 END) AS interventions_expertise,
  MAX(i.intervention_date) AS last_intervention_date,
  p.created_at
FROM projects p
JOIN clients c ON p.client_id = c.id
LEFT JOIN interventions i ON p.id = i.project_id
GROUP BY p.id;
