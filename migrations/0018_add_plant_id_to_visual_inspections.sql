-- Add plant_id column to visual_inspections table
ALTER TABLE visual_inspections ADD COLUMN plant_id INTEGER;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_visual_inspections_plant_id ON visual_inspections(plant_id);
