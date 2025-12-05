-- ============================================================================
-- MIGRATION 0055: Ajouter colonnes R2 à table photos existante
-- ============================================================================
-- Ajout colonnes pour stockage R2 en complément du Base64 existant
-- ============================================================================

-- Ajouter colonnes R2
ALTER TABLE photos ADD COLUMN r2_key TEXT;
ALTER TABLE photos ADD COLUMN public_url TEXT;
ALTER TABLE photos ADD COLUMN mime_type TEXT;

-- Créer index pour recherches R2
CREATE INDEX IF NOT EXISTS idx_photos_r2_key ON photos(r2_key);

-- Renommer module_type vers photo_type pour cohérence
-- Note: SQLite ne supporte pas ALTER COLUMN, donc on utilise module_type comme photo_type

-- ============================================================================
-- FIN MIGRATION 0055
-- ============================================================================
