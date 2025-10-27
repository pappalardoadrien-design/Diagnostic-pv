-- ============================================================================
-- SCHEMA D1 UNIFIÉ DIAGPV - PLATEFORME MONOLITHE MODULAIRE
-- ============================================================================
-- Version: 2.0.0
-- Date: 2025-10-27
-- Description: Fusion Module EL + Architecture HUB pour 6 modules diagnostics
-- Modules supportés: EL, I-V, Thermique, Isolation, Visuels, Expertise
-- ============================================================================

-- ============================================================================
-- TABLES CORE - FONDATIONS PLATEFORME
-- ============================================================================

-- Table des utilisateurs (techniciens certifiés DiagPV)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'technician', -- 'admin', 'technician', 'viewer'
  certification_level TEXT, -- 'N1', 'N2', 'N3'
  phone TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
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

-- Table des projets (installations PV)
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  site_address TEXT NOT NULL,
  installation_power REAL, -- kWc
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

-- Table des interventions (missions techniques)
CREATE TABLE IF NOT EXISTS interventions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  technician_id INTEGER NOT NULL,
  intervention_type TEXT NOT NULL, -- 'el', 'iv', 'thermique', 'isolation', 'visuels', 'expertise'
  intervention_date DATE NOT NULL,
  duration_hours REAL,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  weather_conditions TEXT,
  temperature_ambient REAL,
  irradiance REAL, -- W/m²
  notes TEXT,
  report_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- ============================================================================
-- MODULE ÉLECTROLUMINESCENCE (EL) - PRIORITÉ #1
-- ============================================================================

-- Table des audits EL (fusionnée depuis ancienne table audits)
CREATE TABLE IF NOT EXISTS el_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER, -- Nullable pour migration depuis anciennes données
  audit_token TEXT UNIQUE NOT NULL, -- Gardé pour compatibilité URLs existantes
  project_name TEXT NOT NULL, -- Dénormalisé pour rapidité (sera lié à projects après migration)
  client_name TEXT NOT NULL, -- Dénormalisé pour rapidité (sera lié à clients après migration)
  location TEXT,
  string_count INTEGER NOT NULL,
  modules_per_string INTEGER NOT NULL,
  total_modules INTEGER NOT NULL,
  configuration_json TEXT, -- Configuration détaillée strings/modules
  plan_file_url TEXT, -- URL fichier plan installation
  status TEXT DEFAULT 'created', -- 'created', 'in_progress', 'completed', 'archived'
  completion_rate REAL DEFAULT 0, -- Pourcentage modules diagnostiqués (0-100)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE SET NULL
);

-- Table des modules EL (fusionnée depuis ancienne table modules)
CREATE TABLE IF NOT EXISTS el_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  el_audit_id INTEGER NOT NULL,
  audit_token TEXT NOT NULL, -- Gardé pour compatibilité
  module_identifier TEXT NOT NULL, -- Ex: "S1-12" (String 1, Position 12)
  string_number INTEGER NOT NULL,
  position_in_string INTEGER NOT NULL,
  defect_type TEXT DEFAULT 'pending', -- 'none', 'microcrack', 'dead_module', 'luminescence_inequality', 'pid', 'diode_failure'
  severity_level INTEGER DEFAULT 0, -- 0=OK, 1=Mineur, 2=Moyen, 3=Critique
  comment TEXT,
  technician_id INTEGER,
  physical_row INTEGER, -- Position physique sur site (rangée)
  physical_col INTEGER, -- Position physique sur site (colonne)
  image_url TEXT, -- URL photo EL module
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (el_audit_id) REFERENCES el_audits(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id),
  UNIQUE(el_audit_id, module_identifier)
);

-- Table des sessions collaboratives EL (multi-techniciens temps réel)
CREATE TABLE IF NOT EXISTS el_collaborative_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  technician_id INTEGER NOT NULL,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  cursor_position TEXT, -- Position curseur JSON pour collaboration temps réel
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- ============================================================================
-- MODULE COURBES I-V - PRIORITÉ #2 (À DÉVELOPPER Q1 2026)
-- ============================================================================

-- Table des mesures I-V
CREATE TABLE IF NOT EXISTS iv_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  string_number INTEGER,
  module_number INTEGER,
  measurement_type TEXT NOT NULL, -- 'bright' (sous irradiance), 'dark' (sombre)
  
  -- Paramètres mesurés
  isc REAL, -- Courant court-circuit (A)
  voc REAL, -- Tension circuit ouvert (V)
  pmax REAL, -- Puissance maximale (W)
  impp REAL, -- Courant au point Pmax (A)
  vmpp REAL, -- Tension au point Pmax (V)
  fill_factor REAL, -- Facteur de forme (%)
  
  -- Conditions mesure
  irradiance REAL, -- W/m²
  temperature_module REAL, -- °C
  temperature_ambient REAL, -- °C
  
  -- Données courbe
  iv_curve_data TEXT, -- JSON array points [V, I]
  
  -- Analyse vs STC (Standard Test Conditions)
  pmax_stc_corrected REAL, -- Pmax corrigée aux STC (W)
  deviation_from_datasheet REAL, -- Écart vs datasheet constructeur (%)
  
  -- Résistances
  rs REAL, -- Résistance série (Ω)
  rsh REAL, -- Résistance shunt (Ω)
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
);

-- ============================================================================
-- MODULE THERMOGRAPHIE - PRIORITÉ #3 (À DÉVELOPPER Q2 2026)
-- ============================================================================

-- Table des mesures thermiques
CREATE TABLE IF NOT EXISTS thermal_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  measurement_method TEXT NOT NULL, -- 'drone', 'handheld'
  
  -- Paramètres thermiques
  temperature_max REAL, -- °C (température maximale détectée)
  temperature_min REAL, -- °C
  temperature_avg REAL, -- °C
  delta_t_max REAL, -- °C (écart max par rapport à température moyenne)
  
  -- Localisation
  string_number INTEGER,
  module_number INTEGER,
  gps_latitude REAL,
  gps_longitude REAL,
  
  -- Images
  thermal_image_url TEXT, -- URL image thermique brute
  thermal_map_url TEXT, -- URL carte thermique analysée
  visible_image_url TEXT, -- URL image visible (référence)
  
  -- Classification défaut
  defect_type TEXT, -- 'hotspot', 'bypass_diode_failure', 'connection_issue', 'soiling', 'none'
  severity_level INTEGER, -- 0=OK, 1=Mineur, 2=Moyen, 3=Critique
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
);

-- ============================================================================
-- MODULE ISOLATION - PRIORITÉ #4 (À DÉVELOPPER Q3 2026)
-- ============================================================================

-- Table des tests d'isolement
CREATE TABLE IF NOT EXISTS isolation_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  test_type TEXT NOT NULL, -- 'dc_isolation', 'ground_continuity', 'polarity'
  test_voltage REAL, -- Tension test (V) - Ex: 500V, 1000V
  
  -- Résultats
  resistance_value REAL, -- MΩ (résistance isolement mesurée)
  pass_threshold REAL, -- MΩ (seuil conformité - min 1 MΩ selon NF C 15-100)
  test_result TEXT NOT NULL, -- 'pass', 'fail', 'warning'
  
  -- Localisation
  string_number INTEGER,
  measurement_point TEXT, -- 'positive_to_ground', 'negative_to_ground', 'positive_to_negative'
  
  -- Normes
  compliance_standard TEXT, -- 'NF C 15-100', 'UTE C 15-712-1', 'IEC 62446-1'
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
);

-- ============================================================================
-- MODULE CONTRÔLES VISUELS - PRIORITÉ #5 (À DÉVELOPPER Q4 2026)
-- ============================================================================

-- Table des inspections visuelles
CREATE TABLE IF NOT EXISTS visual_inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  inspection_type TEXT NOT NULL, -- 'modules', 'structure', 'cabling', 'inverter', 'protections'
  
  -- Localisation
  string_number INTEGER,
  module_number INTEGER,
  location_description TEXT,
  
  -- Défaut détecté
  defect_found BOOLEAN DEFAULT 0,
  defect_type TEXT, -- 'corrosion', 'glass_breakage', 'delamination', 'soiling', 'shading', 'loose_connection', 'missing_label'
  severity_level INTEGER, -- 0=OK, 1=Mineur, 2=Moyen, 3=Critique
  
  -- Documentation
  photo_url TEXT, -- URL photo défaut
  gps_latitude REAL,
  gps_longitude REAL,
  
  -- Actions
  corrective_action_required BOOLEAN DEFAULT 0,
  corrective_action_description TEXT,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
);

-- ============================================================================
-- MODULE EXPERTISE POST-SINISTRE - PRIORITÉ #6 (À DÉVELOPPER 2027)
-- ============================================================================

-- Table des expertises sinistres
CREATE TABLE IF NOT EXISTS post_incident_expertise (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  incident_date DATE NOT NULL,
  incident_type TEXT NOT NULL, -- 'fire', 'storm', 'hail', 'lightning', 'electrical_failure', 'water_damage'
  
  -- Analyse causes
  root_cause TEXT,
  contributing_factors TEXT, -- JSON array facteurs contributifs
  
  -- Pertes
  affected_modules_count INTEGER,
  affected_strings_count INTEGER,
  estimated_power_loss_kw REAL, -- Perte puissance (kWc)
  estimated_production_loss_kwh_year REAL, -- Perte production annuelle (kWh/an)
  estimated_financial_loss_eur REAL, -- Perte financière estimée (€)
  
  -- Documentation
  incident_photos_urls TEXT, -- JSON array URLs photos
  insurance_report_url TEXT,
  expert_report_url TEXT,
  
  -- Recommandations
  safety_hazard BOOLEAN DEFAULT 0,
  immediate_actions_required TEXT,
  repair_recommendations TEXT,
  prevention_recommendations TEXT,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE MESURES PVSERV (OPTIONNEL - IMPORT DONNÉES EXTERNES)
-- ============================================================================

-- Table des mesures PVserv (analyse courbes I-V externe)
CREATE TABLE IF NOT EXISTS pvserv_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER,
  audit_token TEXT, -- Compatibilité anciennes données
  string_number INTEGER,
  module_number INTEGER,
  ff REAL, -- Fill Factor
  rds REAL, -- Résistance dynamique série
  uf REAL, -- Tension forward
  measurement_type TEXT, -- 'bright', 'dark'
  iv_curve_data TEXT, -- JSON données courbe I-V
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEX PERFORMANCE
-- ============================================================================

-- Index tables CORE
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_interventions_project ON interventions(project_id);
CREATE INDEX IF NOT EXISTS idx_interventions_technician ON interventions(technician_id);
CREATE INDEX IF NOT EXISTS idx_interventions_type ON interventions(intervention_type);
CREATE INDEX IF NOT EXISTS idx_interventions_date ON interventions(intervention_date);

-- Index Module EL
CREATE INDEX IF NOT EXISTS idx_el_audits_token ON el_audits(audit_token);
CREATE INDEX IF NOT EXISTS idx_el_audits_intervention ON el_audits(intervention_id);
CREATE INDEX IF NOT EXISTS idx_el_audits_status ON el_audits(status);
CREATE INDEX IF NOT EXISTS idx_el_audits_created ON el_audits(created_at);
CREATE INDEX IF NOT EXISTS idx_el_modules_audit_id ON el_modules(el_audit_id);
CREATE INDEX IF NOT EXISTS idx_el_modules_audit_token ON el_modules(audit_token);
CREATE INDEX IF NOT EXISTS idx_el_modules_string ON el_modules(string_number);
CREATE INDEX IF NOT EXISTS idx_el_modules_defect ON el_modules(defect_type);
CREATE INDEX IF NOT EXISTS idx_el_modules_severity ON el_modules(severity_level);
CREATE INDEX IF NOT EXISTS idx_el_sessions_audit ON el_collaborative_sessions(audit_token);
CREATE INDEX IF NOT EXISTS idx_el_sessions_active ON el_collaborative_sessions(is_active);

-- Index Module I-V
CREATE INDEX IF NOT EXISTS idx_iv_intervention ON iv_measurements(intervention_id);
CREATE INDEX IF NOT EXISTS idx_iv_string ON iv_measurements(string_number);

-- Index Module Thermique
CREATE INDEX IF NOT EXISTS idx_thermal_intervention ON thermal_measurements(intervention_id);
CREATE INDEX IF NOT EXISTS idx_thermal_defect ON thermal_measurements(defect_type);
CREATE INDEX IF NOT EXISTS idx_thermal_severity ON thermal_measurements(severity_level);

-- Index Module Isolation
CREATE INDEX IF NOT EXISTS idx_isolation_intervention ON isolation_tests(intervention_id);
CREATE INDEX IF NOT EXISTS idx_isolation_result ON isolation_tests(test_result);

-- Index Module Visuels
CREATE INDEX IF NOT EXISTS idx_visual_intervention ON visual_inspections(intervention_id);
CREATE INDEX IF NOT EXISTS idx_visual_defect_found ON visual_inspections(defect_found);
CREATE INDEX IF NOT EXISTS idx_visual_severity ON visual_inspections(severity_level);

-- Index Module Expertise
CREATE INDEX IF NOT EXISTS idx_expertise_intervention ON post_incident_expertise(intervention_id);
CREATE INDEX IF NOT EXISTS idx_expertise_incident_type ON post_incident_expertise(incident_type);
CREATE INDEX IF NOT EXISTS idx_expertise_incident_date ON post_incident_expertise(incident_date);

-- Index PVserv
CREATE INDEX IF NOT EXISTS idx_pvserv_intervention ON pvserv_measurements(intervention_id);
CREATE INDEX IF NOT EXISTS idx_pvserv_audit_token ON pvserv_measurements(audit_token);

-- ============================================================================
-- TRIGGERS AUTOMATIQUES
-- ============================================================================

-- Trigger MAJ updated_at pour users
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger MAJ updated_at pour clients
CREATE TRIGGER IF NOT EXISTS update_clients_timestamp 
AFTER UPDATE ON clients
BEGIN
  UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger MAJ updated_at pour projects
CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
AFTER UPDATE ON projects
BEGIN
  UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger MAJ updated_at pour interventions
CREATE TRIGGER IF NOT EXISTS update_interventions_timestamp 
AFTER UPDATE ON interventions
BEGIN
  UPDATE interventions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger MAJ updated_at pour el_audits
CREATE TRIGGER IF NOT EXISTS update_el_audits_timestamp 
AFTER UPDATE ON el_audits
BEGIN
  UPDATE el_audits SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger MAJ updated_at pour el_modules
CREATE TRIGGER IF NOT EXISTS update_el_modules_timestamp 
AFTER UPDATE ON el_modules
BEGIN
  UPDATE el_modules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger calcul completion_rate automatique pour el_audits
CREATE TRIGGER IF NOT EXISTS update_el_audit_completion_rate
AFTER UPDATE OF defect_type ON el_modules
BEGIN
  UPDATE el_audits 
  SET completion_rate = (
    SELECT CAST(COUNT(*) AS REAL) * 100.0 / NEW.total_modules
    FROM el_modules 
    WHERE el_audit_id = NEW.el_audit_id 
    AND defect_type != 'pending'
  )
  WHERE id = NEW.el_audit_id;
END;

-- ============================================================================
-- VUES UTILITAIRES
-- ============================================================================

-- Vue statistiques Module EL par audit
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

-- Vue dashboard global tous modules
CREATE VIEW IF NOT EXISTS v_dashboard_overview AS
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

-- ============================================================================
-- COMMENTAIRES DOCUMENTATION
-- ============================================================================

-- Cette migration crée le schéma unifié pour la plateforme DiagPV monolithe.
-- 
-- ARCHITECTURE:
-- - Tables CORE: users, clients, projects, interventions (fondation commune)
-- - Module EL: el_audits, el_modules, el_collaborative_sessions (PRIORITÉ #1)
-- - Module I-V: iv_measurements (PRIORITÉ #2 - Q1 2026)
-- - Module Thermique: thermal_measurements (PRIORITÉ #3 - Q2 2026)
-- - Module Isolation: isolation_tests (PRIORITÉ #4 - Q3 2026)
-- - Module Visuels: visual_inspections (PRIORITÉ #5 - Q4 2026)
-- - Module Expertise: post_incident_expertise (PRIORITÉ #6 - 2027)
--
-- MIGRATION DONNÉES EXISTANTES:
-- - Anciennes tables 'audits' → 'el_audits' (audit_token préservé)
-- - Anciennes tables 'modules' → 'el_modules' (compatibilité audit_token)
-- - Mapping statuts: ok→none, microcracks→microcrack, dead→dead_module, inequality→luminescence_inequality
-- - Calcul severity_level: ok=0, inequality=1, microcrack=2, dead=3
--
-- SCALABILITÉ:
-- - Tous modules liés via intervention_id → project_id → client_id
-- - Index optimisés pour requêtes cross-modules
-- - Vues précalculées pour dashboards
-- - Triggers automatiques pour cohérence données
