-- ============================================================================
-- Migration 0014 : Ajout colonnes de liaison audit EL dans pv_modules
-- ============================================================================
-- Objectif : Lier directement modules PV aux audits/modules EL
-- Auteur : DiagPV Assistant
-- Date : 2025-11-10
-- ============================================================================

-- Ajouter colonnes de traçabilité audit EL
ALTER TABLE pv_modules ADD COLUMN el_audit_id INTEGER;
ALTER TABLE pv_modules ADD COLUMN el_audit_token TEXT;
ALTER TABLE pv_modules ADD COLUMN el_module_id INTEGER;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_pv_modules_el_audit ON pv_modules(el_audit_id);
CREATE INDEX IF NOT EXISTS idx_pv_modules_el_audit_token ON pv_modules(el_audit_token);
CREATE INDEX IF NOT EXISTS idx_pv_modules_el_module_id ON pv_modules(el_module_id);

-- ============================================================================
-- FIN MIGRATION 0014
-- ============================================================================
