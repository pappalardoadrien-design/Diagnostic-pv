-- Schéma initial pour le HUB Diagnostic Photovoltaïque
-- Conforme aux normes IEC 62446-1, IEC 60904-1, NFC 15-100

-- Table des utilisateurs (techniciens DiagPV)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'technician', -- admin, technician, manager
  certification_level TEXT, -- N1, N2, N3 selon IEC 62446-1
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des projets/installations
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  site_address TEXT NOT NULL,
  installation_power REAL, -- kWc
  installation_date DATE,
  installer_company TEXT,
  inverter_brand TEXT,
  inverter_model TEXT,
  module_brand TEXT,
  module_model TEXT,
  module_count INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Table des interventions (missions terrain)
CREATE TABLE IF NOT EXISTS interventions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  technician_id INTEGER NOT NULL,
  intervention_type TEXT NOT NULL, -- audit_N1, audit_N2, audit_N3, commissioning, post_sinistre
  scheduled_date DATE NOT NULL,
  completion_date DATE,
  status TEXT NOT NULL DEFAULT 'planned', -- planned, in_progress, completed, cancelled
  weather_conditions TEXT,
  irradiance_level REAL, -- W/m²
  ambient_temperature REAL, -- °C
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- Table des modules (configuration physique installation)
CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  module_identifier TEXT NOT NULL, -- Ex: "1A01", "2B15"
  physical_row INTEGER NOT NULL,
  physical_col INTEGER NOT NULL,
  string_number INTEGER,
  position_in_string INTEGER,
  azimuth REAL, -- degrés
  tilt REAL, -- degrés
  shading_factor REAL DEFAULT 1.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Table des mesures électroluminescence
CREATE TABLE IF NOT EXISTS el_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  module_id INTEGER NOT NULL,
  defect_type TEXT, -- crack, pid, hotspot, diode_failure, etc.
  severity_level TEXT, -- low, medium, high, critical
  image_path TEXT,
  current_injection REAL, -- A
  exposure_time REAL, -- s
  camera_settings TEXT, -- JSON config
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id),
  FOREIGN KEY (module_id) REFERENCES modules(id)
);

-- Table des mesures thermographiques (DIN EN 62446-3)
CREATE TABLE IF NOT EXISTS thermal_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  module_id INTEGER,
  measurement_type TEXT NOT NULL, -- drone, ground, detailed
  temperature_max REAL, -- °C
  temperature_min REAL, -- °C
  temperature_avg REAL, -- °C
  delta_temp REAL, -- °C écart avec modules adjacents
  thermal_anomaly BOOLEAN DEFAULT FALSE,
  image_path TEXT,
  irradiance_at_measurement REAL, -- W/m²
  wind_speed REAL, -- m/s
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id),
  FOREIGN KEY (module_id) REFERENCES modules(id)
);

-- Table des courbes I-V (IEC 60904-1)
CREATE TABLE IF NOT EXISTS iv_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  string_id TEXT NOT NULL, -- identifiant string
  measurement_type TEXT NOT NULL, -- dark, reference, stc_corrected
  isc REAL, -- A courant court-circuit
  voc REAL, -- V tension circuit ouvert
  imp REAL, -- A courant point puissance max
  vmp REAL, -- V tension point puissance max
  pmax REAL, -- W puissance maximale
  fill_factor REAL,
  irradiance REAL, -- W/m²
  cell_temperature REAL, -- °C
  curve_data TEXT, -- JSON des points I-V
  reference_curve TEXT, -- JSON courbe constructeur
  deviation_percentage REAL, -- % écart vs référence
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id)
);

-- Table des tests d'isolement (NFC 15-100)
CREATE TABLE IF NOT EXISTS isolation_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  test_type TEXT NOT NULL, -- dc_isolation, ac_isolation, continuity
  test_voltage REAL, -- V tension de test
  resistance_value REAL, -- MOhm
  test_duration INTEGER, -- s
  compliance_status BOOLEAN, -- conforme NFC 15-100
  min_required_resistance REAL, -- MOhm valeur mini requise
  temperature_at_test REAL, -- °C
  humidity_level REAL, -- %
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id)
);

-- Table des contrôles visuels (IEC 62446-1)
CREATE TABLE IF NOT EXISTS visual_inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  module_id INTEGER,
  inspection_category TEXT NOT NULL, -- mechanical, electrical, safety, environmental
  defect_found BOOLEAN DEFAULT FALSE,
  defect_description TEXT,
  severity_assessment TEXT, -- minor, major, critical
  corrective_action_required BOOLEAN DEFAULT FALSE,
  corrective_action_description TEXT,
  photo_evidence TEXT, -- chemin vers photos
  inspector_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id),
  FOREIGN KEY (module_id) REFERENCES modules(id)
);

-- Table expertise post-sinistre
CREATE TABLE IF NOT EXISTS post_incident_expertise (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  incident_type TEXT NOT NULL, -- fire, storm, hail, theft, electrical
  incident_date DATE,
  insurance_company TEXT,
  claim_number TEXT,
  damage_assessment TEXT,
  estimated_loss_kwh REAL, -- kWh/an perte production
  estimated_loss_euros REAL, -- €/an perte financière
  replacement_cost REAL, -- € coût remplacement
  repair_feasibility TEXT, -- feasible, not_feasible, partial
  expert_conclusions TEXT,
  photo_documentation TEXT, -- chemins photos
  report_status TEXT DEFAULT 'draft', -- draft, final, delivered
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id)
);

-- Table des rapports générés
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  report_type TEXT NOT NULL, -- audit_N1, audit_N2, audit_N3, commissioning, expertise
  report_title TEXT NOT NULL,
  executive_summary TEXT, -- résumé exécutif <= 10 lignes
  technical_findings TEXT, -- constats techniques détaillés
  recommendations TEXT, -- préconisations hiérarchisées
  performance_impact TEXT, -- impact kWh/an et €/an
  report_file_path TEXT, -- chemin vers PDF généré
  generation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivery_date DATETIME,
  client_validation BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id)
);

-- Index pour optimisation des requêtes
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_interventions_project_id ON interventions(project_id);
CREATE INDEX IF NOT EXISTS idx_interventions_technician_id ON interventions(technician_id);
CREATE INDEX IF NOT EXISTS idx_interventions_date ON interventions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_modules_project_id ON modules(project_id);
CREATE INDEX IF NOT EXISTS idx_modules_position ON modules(physical_row, physical_col);
CREATE INDEX IF NOT EXISTS idx_el_measurements_intervention_id ON el_measurements(intervention_id);
CREATE INDEX IF NOT EXISTS idx_thermal_measurements_intervention_id ON thermal_measurements(intervention_id);
CREATE INDEX IF NOT EXISTS idx_iv_measurements_intervention_id ON iv_measurements(intervention_id);
CREATE INDEX IF NOT EXISTS idx_isolation_tests_intervention_id ON isolation_tests(intervention_id);
CREATE INDEX IF NOT EXISTS idx_visual_inspections_intervention_id ON visual_inspections(intervention_id);
CREATE INDEX IF NOT EXISTS idx_post_incident_intervention_id ON post_incident_expertise(intervention_id);
CREATE INDEX IF NOT EXISTS idx_reports_intervention_id ON reports(intervention_id);