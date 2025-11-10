-- ============================================================================
-- MIGRATION 0012: Add strings_config to pv_zones
-- ============================================================================
-- Date: 2025-11-10
-- Objectif: Sauvegarder configuration électrique strings non réguliers
-- Cas d'usage: Restaurer config strings au reload (ex: S1=26, S2=24, S3=28)
-- ============================================================================

-- Ajouter colonne strings_config à pv_zones pour stocker config strings en JSON
-- Format: [{"string_number":1,"modules_count":26},{"string_number":2,"modules_count":24}]
ALTER TABLE pv_zones ADD COLUMN strings_config TEXT DEFAULT NULL;

-- ============================================================================
-- FIN MIGRATION 0012
-- ============================================================================
