-- ============================================================================
-- MIGRATION 0036: Ajouter audit_types aux projects pour GIRASOLE
-- ============================================================================
-- Permet de définir quelles checklists sont nécessaires par centrale
-- Format JSON: ["CONFORMITE"] ou ["CONFORMITE", "TOITURE"]

-- Ajouter colonne audit_types (JSON array)
ALTER TABLE projects ADD COLUMN audit_types TEXT DEFAULT '["CONFORMITE"]';

-- Créer index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_projects_audit_types ON projects(audit_types);

-- Exemples de valeurs possibles:
-- '["CONFORMITE"]' → Uniquement checklist Conformité NF C 15-100
-- '["TOITURE"]' → Uniquement checklist Toiture DTU 40.35
-- '["CONFORMITE", "TOITURE"]' → Les deux checklists (13 centrales spéciales)
