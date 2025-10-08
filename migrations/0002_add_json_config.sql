-- Migration 0002: Ajout support configuration JSON et positions physiques

-- Ajout colonne pour stocker la configuration JSON complète
ALTER TABLE audits ADD COLUMN json_config TEXT;

-- Ajout colonnes pour positions physiques des modules  
ALTER TABLE modules ADD COLUMN physical_row INTEGER;
ALTER TABLE modules ADD COLUMN physical_col INTEGER;

-- Index pour recherche par position physique
CREATE INDEX IF NOT EXISTS idx_modules_position ON modules(physical_row, physical_col);