-- Migration 0022: Add audit_types to projects for GIRASOLE multi-checklist support
-- Date: 2025-11-20

-- Add audit_types column to projects table
-- Format: JSON array like ["CONFORMITE"] or ["CONFORMITE", "TOITURE"]
ALTER TABLE projects ADD COLUMN audit_types TEXT DEFAULT '["CONFORMITE"]';

-- Add is_girasole flag for filtering GIRASOLE projects
ALTER TABLE projects ADD COLUMN is_girasole INTEGER DEFAULT 0;

-- Add ID_referent for GIRASOLE reference ID
ALTER TABLE projects ADD COLUMN id_referent TEXT;
