-- Migration 0039: Ajouter colonnes GIRASOLE manquantes à projects
-- Complète la migration 0036 qui n'a ajouté que audit_types

-- Ajouter is_girasole pour identifier les projets GIRASOLE
ALTER TABLE projects ADD COLUMN is_girasole INTEGER DEFAULT 0;

-- Ajouter id_referent pour le numéro de référence GIRASOLE
ALTER TABLE projects ADD COLUMN id_referent TEXT;

-- Créer indexes pour performances
CREATE INDEX IF NOT EXISTS idx_projects_is_girasole ON projects(is_girasole);
CREATE INDEX IF NOT EXISTS idx_projects_id_referent ON projects(id_referent);
