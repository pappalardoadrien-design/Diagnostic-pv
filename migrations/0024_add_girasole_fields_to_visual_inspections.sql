-- Migration 0024: Add GIRASOLE specific fields to visual_inspections
-- Date: 2025-11-20
-- Support CONFORMITE and TOITURE checklist types

-- Add checklist_type column
ALTER TABLE visual_inspections ADD COLUMN checklist_type TEXT DEFAULT 'IEC_62446';

-- Add project_id for direct link to projects table
ALTER TABLE visual_inspections ADD COLUMN project_id INTEGER;

-- Add foreign key index
CREATE INDEX IF NOT EXISTS idx_visual_inspections_project_id ON visual_inspections(project_id);

-- Add index on checklist_type for filtering
CREATE INDEX IF NOT EXISTS idx_visual_inspections_checklist_type ON visual_inspections(checklist_type);
