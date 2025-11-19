-- Migration 0033: Correction schéma visual_inspections
-- Ajouter colonne inspection_date manquante

-- Vérifier et ajouter inspection_date si manquant
ALTER TABLE visual_inspections ADD COLUMN inspection_date DATE DEFAULT CURRENT_DATE;

-- Créer index si pas encore créé
CREATE INDEX IF NOT EXISTS idx_visual_inspections_date ON visual_inspections(inspection_date);
