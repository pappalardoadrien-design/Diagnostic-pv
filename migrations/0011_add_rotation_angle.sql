-- ============================================================================
-- MIGRATION 0011: Add rectangles_config to pv_zones
-- ============================================================================
-- Date: 2025-11-10
-- Objectif: Sauvegarder configuration complète des rectangles de modules
-- Cas d'usage: Restaurer rectangles avec rotation, dimensions, position
-- ============================================================================

-- Ajouter colonne rectangles_config à pv_zones pour stocker config rectangles en JSON
-- Format: [{"id":1,"rows":11,"cols":22,"rotation":45,"bounds":[[lat,lng],[lat,lng]]}]
ALTER TABLE pv_zones ADD COLUMN rectangles_config TEXT DEFAULT NULL;

-- ============================================================================
-- FIN MIGRATION 0011
-- ============================================================================
