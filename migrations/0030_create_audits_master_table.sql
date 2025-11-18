-- ============================================================================
-- Migration 0030 : Création table audits principale (Architecture Multi-Modules)
-- ============================================================================
-- Objectif : Créer une table centrale pour gérer les audits multi-modules
-- avec un audit_token unique partagé entre tous les modules (EL, I-V, Visuels, Isolation)
--
-- Architecture :
--   audits (1) → el_audits (0..1)
--   audits (1) → iv_measurements (0..N)
--   audits (1) → visual_inspections (0..N)
--   audits (1) → isolation_tests (0..N)
--
-- Flux :
--   CRM Dashboard → Créer Audit Multi-Modules → Cocher modules à utiliser
--   → 1 audit créé avec audit_token unique
--   → Chaque module stocke ses données avec ce audit_token
-- ============================================================================

-- Table principale audits (Master)
CREATE TABLE IF NOT EXISTS audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT UNIQUE NOT NULL,
  
  -- Liens vers intervention/client/projet
  intervention_id INTEGER,
  client_id INTEGER,
  project_id INTEGER,
  
  -- Informations audit
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT,
  audit_date DATE DEFAULT CURRENT_DATE,
  
  -- Modules activés (JSON array: ["EL", "IV", "VISUAL", "ISOLATION"])
  modules_enabled TEXT NOT NULL DEFAULT '["EL"]',
  
  -- Configuration PV héritée (JSON)
  configuration_json TEXT,
  
  -- Statut global audit
  status TEXT DEFAULT 'en_cours',
  -- Valeurs possibles: en_cours, termine, archive, annule
  
  -- Métadonnées
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  -- Contraintes clés étrangères
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_audits_token ON audits(audit_token);
CREATE INDEX IF NOT EXISTS idx_audits_intervention ON audits(intervention_id);
CREATE INDEX IF NOT EXISTS idx_audits_client ON audits(client_id);
CREATE INDEX IF NOT EXISTS idx_audits_project ON audits(project_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_date ON audits(audit_date);

-- ============================================================================
-- Ajouter colonnes audit_token et audit_id dans les tables modules existantes
-- ============================================================================

-- Table el_audits : lien vers audits master
ALTER TABLE el_audits ADD COLUMN audit_id INTEGER 
  REFERENCES audits(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_el_audits_audit_id ON el_audits(audit_id);

-- Table iv_measurements : ajout audit_token + audit_id
ALTER TABLE iv_measurements ADD COLUMN audit_token TEXT;
ALTER TABLE iv_measurements ADD COLUMN audit_id INTEGER 
  REFERENCES audits(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_iv_measurements_token ON iv_measurements(audit_token);
CREATE INDEX IF NOT EXISTS idx_iv_measurements_audit_id ON iv_measurements(audit_id);

-- Table visual_inspections : ajout audit_token + audit_id
ALTER TABLE visual_inspections ADD COLUMN audit_token TEXT;
ALTER TABLE visual_inspections ADD COLUMN audit_id INTEGER 
  REFERENCES audits(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_visual_inspections_token ON visual_inspections(audit_token);
CREATE INDEX IF NOT EXISTS idx_visual_inspections_audit_id ON visual_inspections(audit_id);

-- Table isolation_tests : ajout audit_token + audit_id
ALTER TABLE isolation_tests ADD COLUMN audit_token TEXT;
ALTER TABLE isolation_tests ADD COLUMN audit_id INTEGER 
  REFERENCES audits(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_isolation_tests_token ON isolation_tests(audit_token);
CREATE INDEX IF NOT EXISTS idx_isolation_tests_audit_id ON isolation_tests(audit_id);

-- ============================================================================
-- Note sur la compatibilité :
-- - audit_token reste dans chaque table pour compatibilité URLs (/audit/:token)
-- - audit_id permet les jointures SQL performantes
-- - Les anciens audits EL continuent de fonctionner (audit_id NULL)
-- ============================================================================
