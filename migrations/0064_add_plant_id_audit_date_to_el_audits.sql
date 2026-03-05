-- Migration 0064: Ajouter plant_id et audit_date à el_audits
-- Date: 2026-03-05
-- Description: Colonnes requises par aggregator unifié et preview
-- plant_id: liaison directe avec pv_plants sans passer par pv_cartography_audit_links
-- audit_date: date de l'audit sur site (vs created_at = date de création dans l'app)

ALTER TABLE el_audits ADD COLUMN plant_id INTEGER REFERENCES pv_plants(id) ON DELETE SET NULL;
ALTER TABLE el_audits ADD COLUMN audit_date DATE;

CREATE INDEX IF NOT EXISTS idx_el_audits_plant_id ON el_audits(plant_id);
CREATE INDEX IF NOT EXISTS idx_el_audits_audit_date ON el_audits(audit_date);
