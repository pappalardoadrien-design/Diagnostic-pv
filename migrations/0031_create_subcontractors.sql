-- Migration 0031: Création table sous-traitants (partenaires techniques)
-- Date: 2025-11-18
-- Description: Gestion des sous-traitants DiagPV pour attribution missions

-- ============================================================================
-- TABLE SOUS-TRAITANTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS subcontractors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  siret TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'France',
  
  -- Spécialités techniques
  specialties TEXT NOT NULL, -- JSON array: ["EL", "IV", "THERMOGRAPHY", "VISUAL", "ISOLATION"]
  certifications TEXT, -- JSON array: certifications, qualifications
  equipment TEXT, -- JSON: matériel disponible (caméras EL, testeurs I-V, etc.)
  
  -- Tarification
  hourly_rate REAL, -- Taux horaire standard (€/h)
  daily_rate REAL, -- Taux journalier (€/j)
  travel_cost_per_km REAL DEFAULT 0.50, -- Frais déplacement
  
  -- Capacités
  max_concurrent_missions INTEGER DEFAULT 1, -- Missions simultanées max
  availability_zone TEXT, -- Zone géographique couverte
  languages TEXT, -- JSON array: langues parlées
  
  -- Performance
  rating REAL DEFAULT 0.0, -- Note moyenne /5
  total_missions INTEGER DEFAULT 0, -- Nombre missions réalisées
  success_rate REAL DEFAULT 100.0, -- Taux succès missions (%)
  average_report_delay REAL DEFAULT 5.0, -- Délai moyen livraison rapport (jours)
  
  -- Statut
  status TEXT DEFAULT 'active', -- active, inactive, suspended, blacklisted
  partnership_since DATE DEFAULT CURRENT_DATE,
  last_mission_date DATE,
  
  -- Contract
  contract_type TEXT DEFAULT 'freelance', -- freelance, company, employee
  contract_start_date DATE,
  contract_end_date DATE,
  insurance_valid_until DATE,
  
  -- Notes
  notes TEXT,
  internal_comments TEXT, -- Commentaires internes DiagPV
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_subcontractors_company ON subcontractors(company_name);
CREATE INDEX IF NOT EXISTS idx_subcontractors_email ON subcontractors(contact_email);
CREATE INDEX IF NOT EXISTS idx_subcontractors_status ON subcontractors(status);
CREATE INDEX IF NOT EXISTS idx_subcontractors_rating ON subcontractors(rating);

-- ============================================================================
-- TABLE HISTORIQUE MISSIONS SOUS-TRAITANTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS subcontractor_missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcontractor_id INTEGER NOT NULL,
  intervention_id INTEGER NOT NULL,
  
  -- Détails mission
  mission_date DATE NOT NULL,
  mission_type TEXT NOT NULL, -- el_audit, iv_test, thermography, etc.
  duration_hours REAL,
  
  -- Coûts
  cost_amount REAL, -- Coût facturé par sous-traitant
  travel_distance_km REAL,
  travel_cost REAL,
  total_cost REAL,
  
  -- Performance
  report_delivered_at DATETIME,
  report_delay_days INTEGER, -- Délai livraison (jours)
  quality_rating INTEGER, -- Note qualité 1-5
  client_satisfaction INTEGER, -- Satisfaction client 1-5
  
  -- Statut
  status TEXT DEFAULT 'planned', -- planned, in_progress, completed, cancelled, failed
  
  -- Commentaires
  internal_notes TEXT,
  issues_encountered TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subcontractor_missions_sub ON subcontractor_missions(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_missions_int ON subcontractor_missions(intervention_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_missions_date ON subcontractor_missions(mission_date);
CREATE INDEX IF NOT EXISTS idx_subcontractor_missions_status ON subcontractor_missions(status);

-- ============================================================================
-- TABLE DISPONIBILITÉS SOUS-TRAITANTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS subcontractor_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcontractor_id INTEGER NOT NULL,
  
  -- Période
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  
  -- Type disponibilité
  availability_type TEXT DEFAULT 'available', -- available, unavailable, partial
  
  -- Détails
  notes TEXT,
  recurring BOOLEAN DEFAULT 0, -- Si récurrent (ex: tous les lundis)
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subcontractor_availability_sub ON subcontractor_availability(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_availability_dates ON subcontractor_availability(date_start, date_end);

-- ============================================================================
-- VUE STATISTIQUES SOUS-TRAITANTS
-- ============================================================================
CREATE VIEW IF NOT EXISTS v_subcontractor_stats AS
SELECT 
  s.id,
  s.company_name,
  s.contact_name,
  s.status,
  s.rating,
  COUNT(sm.id) as total_missions,
  COUNT(CASE WHEN sm.status = 'completed' THEN 1 END) as completed_missions,
  COUNT(CASE WHEN sm.status = 'failed' THEN 1 END) as failed_missions,
  ROUND(AVG(sm.quality_rating), 2) as avg_quality,
  ROUND(AVG(sm.report_delay_days), 1) as avg_delay_days,
  SUM(sm.total_cost) as total_revenue,
  MAX(sm.mission_date) as last_mission_date,
  COUNT(CASE WHEN sm.mission_date >= date('now', '-30 days') THEN 1 END) as missions_last_30_days
FROM subcontractors s
LEFT JOIN subcontractor_missions sm ON s.id = sm.subcontractor_id
GROUP BY s.id;
