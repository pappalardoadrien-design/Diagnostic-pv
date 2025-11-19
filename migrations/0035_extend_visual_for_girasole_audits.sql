-- Migration 0035: Extension module VISUAL pour audits qualité GIRASOLE
-- Ajouter colonnes spécifiques audits conformité NF C 15-100 + UTE C 15-712

-- Ajouter colonne conformité (Conforme, Non conforme, S.O)
ALTER TABLE visual_inspections ADD COLUMN conformite TEXT CHECK(conformite IN ('conforme', 'non_conforme', 'so', NULL));

-- Ajouter colonne prescriptions Girasole spécifiques
ALTER TABLE visual_inspections ADD COLUMN prescriptions_girasole TEXT;

-- Ajouter colonne bonnes pratiques
ALTER TABLE visual_inspections ADD COLUMN bonnes_pratiques TEXT;

-- Ajouter colonne catégorie audit (pour distinguer types audit)
ALTER TABLE visual_inspections ADD COLUMN audit_category TEXT DEFAULT 'general';
-- Valeurs possibles: general, conformite_nfc15100, toiture_dtu4035, bureau_etudes

-- Ajouter colonne référence section checklist
ALTER TABLE visual_inspections ADD COLUMN checklist_section TEXT;

-- Ajouter colonne item number (pour tri dans checklist)
ALTER TABLE visual_inspections ADD COLUMN item_order INTEGER DEFAULT 0;

-- Créer index pour performances
CREATE INDEX IF NOT EXISTS idx_visual_conformite ON visual_inspections(conformite);
CREATE INDEX IF NOT EXISTS idx_visual_audit_category ON visual_inspections(audit_category);
CREATE INDEX IF NOT EXISTS idx_visual_checklist_section ON visual_inspections(checklist_section);
