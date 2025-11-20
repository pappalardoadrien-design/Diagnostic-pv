-- Migration 0038: Ajouter colonnes GIRASOLE à visual_inspections
-- Équivalent de migration 0024 locale, mais adaptée pour remote

-- Ajouter checklist_type (IEC_62446 par défaut pour compatibilité)
ALTER TABLE visual_inspections ADD COLUMN checklist_type TEXT DEFAULT 'IEC_62446';

-- Ajouter project_id pour lier les inspections aux projets GIRASOLE
ALTER TABLE visual_inspections ADD COLUMN project_id INTEGER;

-- Créer indexes pour performances
CREATE INDEX IF NOT EXISTS idx_visual_inspections_project_id ON visual_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_visual_inspections_checklist_type ON visual_inspections(checklist_type);

-- Ajouter foreign key pour project_id (note: SQLite ne permet pas d'ajouter FK après coup,
-- mais on peut créer un trigger pour simuler la contrainte)
-- Pour l'instant on laisse sans FK hard, la logique applicative gérera l'intégrité
