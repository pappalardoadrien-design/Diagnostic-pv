-- ============================================================================
-- Migration 0008 : Configuration Strings Non Réguliers
-- ============================================================================
-- Objectif : Sauvegarder configuration électrique détaillée (strings non réguliers)
-- Auteur : DiagPV Assistant
-- Date : 2025-01-29

-- ============================================================================
-- 1. ZONES TOITURE — Configuration Strings Détaillée
-- ============================================================================

-- Configuration strings non réguliers (JSON)
-- Format: [{"stringNum": 1, "modulesCount": 26}, {"stringNum": 2, "modulesCount": 28}, ...]
ALTER TABLE pv_zones ADD COLUMN strings_config TEXT;

-- ============================================================================
-- FIN MIGRATION 0008
-- ============================================================================
