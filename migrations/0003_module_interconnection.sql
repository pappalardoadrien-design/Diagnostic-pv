-- ============================================================================
-- MIGRATION 0003: Interconnexion modules EL ↔ PV Cartography
-- ============================================================================
-- Permet de lier les audits EL aux centrales PV pour navigation cohérente
-- entre modules du Diagnostic Hub

-- Table de liaison intervention ↔ centrale PV
CREATE TABLE IF NOT EXISTS intervention_plants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intervention_id INTEGER NOT NULL,
  plant_id INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT 1,  -- Centrale principale de l'intervention
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE,
  FOREIGN KEY (plant_id) REFERENCES pv_plants(id) ON DELETE CASCADE,
  UNIQUE(intervention_id, plant_id)
);

CREATE INDEX IF NOT EXISTS idx_intervention_plants_intervention ON intervention_plants(intervention_id);
CREATE INDEX IF NOT EXISTS idx_intervention_plants_plant ON intervention_plants(plant_id);

-- Table de liaison audit EL ↔ zone PV (pour positionnement modules)
CREATE TABLE IF NOT EXISTS el_audit_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  el_audit_id INTEGER NOT NULL,
  audit_token TEXT NOT NULL,
  zone_id INTEGER NOT NULL,
  zone_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (el_audit_id) REFERENCES el_audits(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE,
  FOREIGN KEY (zone_id) REFERENCES pv_zones(id) ON DELETE CASCADE,
  UNIQUE(el_audit_id, zone_id)
);

CREATE INDEX IF NOT EXISTS idx_el_audit_zones_audit ON el_audit_zones(el_audit_id);
CREATE INDEX IF NOT EXISTS idx_el_audit_zones_token ON el_audit_zones(audit_token);
CREATE INDEX IF NOT EXISTS idx_el_audit_zones_zone ON el_audit_zones(zone_id);

-- Vue pour lier audit EL → centrale PV via intervention
CREATE VIEW IF NOT EXISTS v_el_audit_plant_links AS
SELECT 
  ea.id AS el_audit_id,
  ea.audit_token,
  ea.project_name,
  ea.client_name,
  ea.intervention_id,
  p.id AS plant_id,
  p.plant_name,
  p.location AS plant_location,
  p.total_modules AS plant_total_modules
FROM el_audits ea
LEFT JOIN intervention_plants ip ON ea.intervention_id = ip.intervention_id
LEFT JOIN pv_plants p ON ip.plant_id = p.id;
