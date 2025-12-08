-- ============================================================================
-- MIGRATION 0057: Cleanup tables obsolètes _new
-- ============================================================================
-- Date: 2025-12-08
-- Objectif: Supprimer tables _new créées pour migrations mais non supprimées
-- 
-- Tables identifiées obsolètes:
--   - interventions_new (Migration 0024)
--   - projects_new (Migration 0025)
--   - el_modules_new (Migration 0028)
--   - el_collaborative_sessions_new (Migration 0028)
--   - iv_measurements_new (Migration 0053)
--
-- Vérification code source: 0 référence trouvée
-- ============================================================================

-- Drop tables _new (ces tables ont déjà été renommées vers tables finales)
DROP TABLE IF EXISTS interventions_new;
DROP TABLE IF EXISTS projects_new;
DROP TABLE IF EXISTS el_modules_new;
DROP TABLE IF EXISTS el_collaborative_sessions_new;
DROP TABLE IF EXISTS iv_measurements_new;

-- Note: Ces tables ont été créées lors de migrations SQLite pour modifier
-- le schéma (ALTER TABLE non supporté pour certaines opérations).
-- Le processus normal était:
--   1. CREATE TABLE xxx_new (...)
--   2. INSERT INTO xxx_new SELECT * FROM xxx
--   3. DROP TABLE xxx
--   4. ALTER TABLE xxx_new RENAME TO xxx
-- 
-- Certaines migrations ont oublié l'étape DROP TABLE xxx_new finale.
-- Cette migration nettoie ces résidus.
