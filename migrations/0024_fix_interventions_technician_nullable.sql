-- Migration 0024: Fix interventions.technician_id to allow NULL (non-assigned interventions)
-- Date: 2025-11-17

-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- 0. Drop views that depend on interventions table
DROP VIEW IF EXISTS v_dashboard_overview;

-- 1. Create new table with correct schema
CREATE TABLE interventions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  technician_id INTEGER,  -- NULLABLE now!
  intervention_type TEXT NOT NULL,
  intervention_date DATE NOT NULL,
  duration_hours REAL,
  status TEXT DEFAULT 'scheduled',
  weather_conditions TEXT,
  temperature_ambient REAL,
  irradiance REAL,
  notes TEXT,
  report_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES auth_users(id) ON DELETE SET NULL
);

-- 2. Copy existing data (if any)
INSERT INTO interventions_new 
SELECT * FROM interventions;

-- 3. Drop old table
DROP TABLE interventions;

-- 4. Rename new table
ALTER TABLE interventions_new RENAME TO interventions;

-- 5. Recreate indexes if needed
CREATE INDEX IF NOT EXISTS idx_interventions_project ON interventions(project_id);
CREATE INDEX IF NOT EXISTS idx_interventions_technician ON interventions(technician_id);
CREATE INDEX IF NOT EXISTS idx_interventions_date ON interventions(intervention_date);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
