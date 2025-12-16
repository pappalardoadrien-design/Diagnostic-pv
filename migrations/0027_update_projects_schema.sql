-- Migration 0027: Update Projects Schema for CRM Compatibility
-- Adds new columns to match the 'Tentative 1' logic in crmRoutes.ts

-- 1. Add new columns
ALTER TABLE projects ADD COLUMN total_power_kwp REAL;
ALTER TABLE projects ADD COLUMN module_count INTEGER;
ALTER TABLE projects ADD COLUMN module_type TEXT;
ALTER TABLE projects ADD COLUMN inverter_type TEXT;
ALTER TABLE projects ADD COLUMN address_street TEXT;
ALTER TABLE projects ADD COLUMN address_postal_code TEXT;
ALTER TABLE projects ADD COLUMN address_city TEXT;
ALTER TABLE projects ADD COLUMN gps_latitude REAL;
ALTER TABLE projects ADD COLUMN gps_longitude REAL;
ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE projects ADD COLUMN inverter_count INTEGER;
ALTER TABLE projects ADD COLUMN inverter_brand TEXT;
ALTER TABLE projects ADD COLUMN junction_box_count INTEGER;
ALTER TABLE projects ADD COLUMN strings_configuration TEXT;
ALTER TABLE projects ADD COLUMN technical_notes TEXT;
ALTER TABLE projects ADD COLUMN acquisition_source TEXT;
ALTER TABLE projects ADD COLUMN assigned_to TEXT;

-- 2. Migrate existing data
UPDATE projects SET 
  total_power_kwp = installation_power,
  module_count = total_modules,
  module_type = module_model,
  inverter_type = inverter_model,
  gps_latitude = latitude,
  gps_longitude = longitude,
  address_street = site_address;

-- 3. Cleanup notes (optional, if we want to extract JSON from notes later, but for now just keep the raw notes)
-- No action needed for notes.

-- 4. Create indexes for new columns if needed
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_city ON projects(address_city);
