-- Migration 0020: Create report_templates table
-- Templates pour rapports flexibles adaptés aux différents types d'audits

CREATE TABLE IF NOT EXISTS report_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_code TEXT UNIQUE NOT NULL,      -- 'commissioning', 'diagnostic_complet', etc.
  display_name TEXT NOT NULL,              -- "Rapport de Commissioning IEC 62446-1"
  description TEXT,                        -- Description du type d'audit
  modules_required TEXT NOT NULL,          -- JSON array: ["visual", "iv_curves", "isolation"]
  modules_optional TEXT,                   -- JSON array: ["el"] (modules optionnels)
  conformity_weights TEXT NOT NULL,        -- JSON object: {"visual": 0.5, "iv_curves": 0.3, "isolation": 0.2}
  report_sections TEXT NOT NULL,           -- JSON array: sections order
  is_active BOOLEAN DEFAULT 1,
  icon TEXT,                               -- Font Awesome icon class
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_report_templates_code ON report_templates(template_code);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(is_active);

-- Insérer templates pré-configurés pour cas d'usage DiagPV

-- Template 1: Commissioning IEC 62446-1 (réception installation neuve)
INSERT INTO report_templates (template_code, display_name, description, modules_required, modules_optional, conformity_weights, report_sections, icon) VALUES (
  'commissioning',
  'Commissioning IEC 62446-1',
  'Rapport de réception d''installation photovoltaïque neuve selon norme IEC 62446-1',
  '["visual", "iv_curves", "isolation"]',
  '["el"]',
  '{"visual": 0.50, "iv_curves": 0.30, "isolation": 0.20}',
  '["cover", "executive_summary", "visual_section", "iv_section", "isolation_section", "recommendations", "signatures"]',
  'fa-clipboard-check'
);

-- Template 2: Diagnostic Complet (audit approfondi)
INSERT INTO report_templates (template_code, display_name, description, modules_required, modules_optional, conformity_weights, report_sections, icon) VALUES (
  'diagnostic_complet',
  'Diagnostic Complet Premium',
  'Audit complet avec tous les modules : EL, Thermographie, IV, Visual, Isolation',
  '["el", "thermal", "iv_curves", "visual", "isolation"]',
  '[]',
  '{"el": 0.30, "thermal": 0.20, "iv_curves": 0.20, "visual": 0.20, "isolation": 0.10}',
  '["cover", "executive_summary", "el_section", "thermal_section", "iv_section", "visual_section", "isolation_section", "global_analysis", "recommendations", "signatures"]',
  'fa-microscope'
);

-- Template 3: Post-Sinistre (expertise après sinistre)
INSERT INTO report_templates (template_code, display_name, description, modules_required, modules_optional, conformity_weights, report_sections, icon) VALUES (
  'post_sinistre',
  'Expertise Post-Sinistre',
  'Rapport d''expertise après sinistre (incendie, grêle, foudre) - Focus EL + Thermographie',
  '["el", "thermal"]',
  '["visual"]',
  '{"el": 0.60, "thermal": 0.40}',
  '["cover", "incident_context", "el_section", "thermal_section", "damage_assessment", "financial_impact", "recommendations", "signatures"]',
  'fa-fire'
);

-- Template 4: Analyse Performance (production)
INSERT INTO report_templates (template_code, display_name, description, modules_required, modules_optional, conformity_weights, report_sections, icon) VALUES (
  'performance',
  'Analyse Performance',
  'Audit centré sur les courbes I-V pour diagnostic de performance électrique',
  '["iv_curves"]',
  '["visual", "isolation"]',
  '{"iv_curves": 1.0}',
  '["cover", "executive_summary", "iv_section", "production_analysis", "optimization_potential", "recommendations", "signatures"]',
  'fa-chart-line'
);

-- Template 5: Audit Minimal (inspection rapide)
INSERT INTO report_templates (template_code, display_name, description, modules_required, modules_optional, conformity_weights, report_sections, icon) VALUES (
  'audit_minimal',
  'Audit Visuel Minimal',
  'Inspection visuelle simple selon IEC 62446-1 (sans mesures)',
  '["visual"]',
  '["isolation"]',
  '{"visual": 1.0}',
  '["cover", "executive_summary", "visual_section", "recommendations", "signatures"]',
  'fa-eye'
);

-- Template 6: Custom (personnalisé)
INSERT INTO report_templates (template_code, display_name, description, modules_required, modules_optional, conformity_weights, report_sections, icon) VALUES (
  'custom',
  'Rapport Personnalisé',
  'Sélection libre des modules et pondérations personnalisées',
  '[]',
  '["el", "thermal", "iv_curves", "visual", "isolation"]',
  '{}',
  '["cover", "executive_summary", "custom_sections", "recommendations", "signatures"]',
  'fa-magic'
);
