-- Migration 0023: Add audit_types to projects for multi-checklist support
-- Date: 2025-11-20

-- Add audit_types column to projects table
-- Format: JSON array like ["CONFORMITE"] or ["CONFORMITE", "TOITURE"]
ALTER TABLE projects ADD COLUMN audit_types TEXT DEFAULT '["CONFORMITE"]';

-- Add ID_referent for project reference ID
ALTER TABLE projects ADD COLUMN id_referent TEXT;
