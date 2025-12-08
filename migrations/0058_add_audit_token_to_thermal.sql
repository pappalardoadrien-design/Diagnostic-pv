-- ============================================================================
-- MIGRATION 0058: Ajouter audit_token à thermal_measurements
-- ============================================================================
-- Date: 2025-12-08
-- Objectif: Interconnecter module Thermographie avec les autres modules
--
-- Actuellement:
--   thermal_measurements utilise seulement intervention_id
--
-- Après migration:
--   thermal_measurements aura aussi audit_token pour corrélation directe
--   avec EL, IV, Visual, Isolation via audit_token commun
--
-- Bénéfices:
--   - Corrélation Thermographie ↔ EL par module_identifier
--   - Rapports PDF multi-modules incluant Thermographie
--   - Cohérence avec architecture shared_configurations
-- ============================================================================

-- Ajouter colonne audit_token
ALTER TABLE thermal_measurements ADD COLUMN audit_token TEXT;

-- Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_thermal_audit_token 
ON thermal_measurements(audit_token);

-- Remplir audit_token depuis interventions → audits
-- (Pour données existantes uniquement)
UPDATE thermal_measurements 
SET audit_token = (
  SELECT a.audit_token 
  FROM audits a 
  WHERE a.intervention_id = thermal_measurements.intervention_id
  LIMIT 1
)
WHERE audit_token IS NULL AND intervention_id IS NOT NULL;

-- ============================================================================
-- Note: La colonne audit_token reste NULLABLE pour compatibilité
-- Les nouveaux enregistrements devront fournir audit_token lors de l'insertion
-- ============================================================================
