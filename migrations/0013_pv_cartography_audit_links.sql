-- ============================================================================
-- MIGRATION 0013: Table liaison PV Cartography <-> Audits EL (version corrigée)
-- ============================================================================
-- Date: 2025-11-10 (corrigée 2026-03-05)
-- Objectif: Synchronisation bidirectionnelle Canvas V2 <-> Module EL
-- NOTE: DROP+CREATE car migration 0006 crée une version simplifiée
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: DROP ancien schéma (créé par 0006) et recréer
-- ============================================================================

DROP VIEW IF EXISTS v_pv_el_links_stats;
DROP TRIGGER IF EXISTS update_pv_cartography_audit_links_timestamp;
DROP TABLE IF EXISTS pv_cartography_audit_links;

CREATE TABLE pv_cartography_audit_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Référence zone PV (Canvas V2)
  pv_zone_id INTEGER,
  pv_plant_id INTEGER NOT NULL,
  
  -- Référence audit EL
  el_audit_id INTEGER,
  el_audit_token TEXT NOT NULL,
  
  -- Métadonnées liaison
  link_type TEXT DEFAULT 'manual',
  sync_direction TEXT DEFAULT 'el_to_pv',
  sync_status TEXT DEFAULT 'linked',
  last_sync_at DATETIME,
  sync_error_message TEXT,
  
  -- Mapping modules (JSON)
  module_mapping TEXT,
  
  -- Stats sync
  total_modules_synced INTEGER DEFAULT 0,
  modules_with_defects INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ÉTAPE 2: INDEX POUR PERFORMANCES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_links_pv_zone ON pv_cartography_audit_links(pv_zone_id);
CREATE INDEX IF NOT EXISTS idx_links_pv_plant ON pv_cartography_audit_links(pv_plant_id);
CREATE INDEX IF NOT EXISTS idx_links_el_audit ON pv_cartography_audit_links(el_audit_id);
CREATE INDEX IF NOT EXISTS idx_links_el_token ON pv_cartography_audit_links(el_audit_token);
CREATE INDEX IF NOT EXISTS idx_links_sync_status ON pv_cartography_audit_links(sync_status);

-- ============================================================================
-- ÉTAPE 3: TRIGGER UPDATE TIMESTAMP
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_pv_cartography_audit_links_timestamp 
AFTER UPDATE ON pv_cartography_audit_links
BEGIN
  UPDATE pv_cartography_audit_links SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- ÉTAPE 4: VUE STATISTIQUES LIAISON (alignée sur schéma réel)
-- ============================================================================

CREATE VIEW IF NOT EXISTS v_pv_el_links_stats AS
SELECT 
  l.id AS link_id,
  l.pv_zone_id,
  l.pv_plant_id,
  l.el_audit_id,
  l.el_audit_token,
  l.sync_status,
  l.last_sync_at,
  
  -- Info zone PV
  z.zone_name AS pv_zone_name,
  p.plant_name AS pv_plant_name,
  
  -- Info audit EL
  a.project_name AS el_project_name,
  a.client_name AS el_client_name,
  a.total_modules AS el_total_modules,
  a.completion_rate AS el_completion_rate,
  
  -- Modules PV zone
  (SELECT COUNT(*) FROM pv_modules WHERE zone_id = l.pv_zone_id) AS pv_modules_count,
  
  -- Modules EL audit
  (SELECT COUNT(*) FROM el_modules WHERE el_audit_id = l.el_audit_id) AS el_modules_count,
  
  -- Sync stats
  l.total_modules_synced,
  l.modules_with_defects,
  
  -- Dates
  l.created_at AS link_created_at,
  l.updated_at AS link_updated_at
  
FROM pv_cartography_audit_links l
LEFT JOIN pv_zones z ON l.pv_zone_id = z.id
LEFT JOIN pv_plants p ON l.pv_plant_id = p.id
LEFT JOIN el_audits a ON l.el_audit_id = a.id;

-- ============================================================================
-- FIN MIGRATION 0013
-- ============================================================================
