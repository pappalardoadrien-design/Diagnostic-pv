-- ============================================================================
-- Migration 0049: Ajout colonnes designer_layouts
-- Date: 2024-11-24
-- Description: Ajout zone_id et zoom_level pour Designer Satellite
-- ============================================================================

-- Ajouter zone_id
ALTER TABLE designer_layouts ADD COLUMN zone_id INTEGER;

-- Ajouter zoom_level
ALTER TABLE designer_layouts ADD COLUMN zoom_level INTEGER DEFAULT 18;

-- Ajouter index sur zone_id
CREATE INDEX IF NOT EXISTS idx_designer_layouts_zone ON designer_layouts(zone_id);
