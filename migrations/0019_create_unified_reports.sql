-- ============================================================================
-- Migration 0019 - Table unified_reports (Module Rapport Unifié Phase 4B)
-- ============================================================================
-- Stockage persistant rapports générés multi-modules
-- Traçabilité conformité DiagPV + historique audits
-- ============================================================================

CREATE TABLE IF NOT EXISTS unified_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identifiant unique rapport
  report_token TEXT UNIQUE NOT NULL,
  
  -- Liens vers entités
  plant_id INTEGER, -- FK vers pv_plants (peut être NULL si rapport audit EL seul)
  audit_el_token TEXT, -- Token audit EL principal (peut être NULL)
  inspection_token TEXT, -- Token inspection visuelle (peut être NULL)
  
  -- Métadonnées rapport
  report_title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  audit_date DATE NOT NULL,
  auditor_name TEXT,
  
  -- Résultats conformité
  overall_conformity_rate REAL NOT NULL, -- Conformité globale (0-100)
  critical_issues_count INTEGER DEFAULT 0,
  major_issues_count INTEGER DEFAULT 0,
  minor_issues_count INTEGER DEFAULT 0,
  
  -- Modules inclus (JSON array)
  -- Exemple: ["el","iv","visual","isolation"]
  modules_included TEXT NOT NULL,
  
  -- Contenu HTML complet
  html_content TEXT NOT NULL,
  
  -- Métadonnées techniques
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  generated_by TEXT, -- Email ou nom auditeur
  report_version TEXT DEFAULT '1.0',
  
  -- Foreign keys
  FOREIGN KEY (plant_id) REFERENCES pv_plants(id) ON DELETE SET NULL
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_unified_reports_token ON unified_reports(report_token);
CREATE INDEX IF NOT EXISTS idx_unified_reports_plant_id ON unified_reports(plant_id);
CREATE INDEX IF NOT EXISTS idx_unified_reports_audit_date ON unified_reports(audit_date);
CREATE INDEX IF NOT EXISTS idx_unified_reports_conformity ON unified_reports(overall_conformity_rate);
CREATE INDEX IF NOT EXISTS idx_unified_reports_created_at ON unified_reports(created_at);
