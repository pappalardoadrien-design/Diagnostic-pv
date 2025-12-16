-- ============================================================================
-- Migration 0049: Creation table designer_layouts
-- Date: 2024-11-24
-- Description: Table pour sauvegarder le layout du Designer Satellite
-- ============================================================================

CREATE TABLE IF NOT EXISTS designer_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id INTEGER NOT NULL,
  modules_json TEXT, -- Position et rotation des modules
  map_center_json TEXT, -- Centre de la carte {lat, lon}
  zoom_level INTEGER DEFAULT 18,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_designer_layouts_zone ON designer_layouts(zone_id);
