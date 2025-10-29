-- ============================================================================
-- MIGRATION 0006: PV CARTOGRAPHY - CANVAS EDITOR & ANNOTATIONS
-- ============================================================================
-- Ajout des colonnes pour Canvas Editor, upload image fond, et annotations
-- Compatible avec architecture existante (non-destructif)

-- ============================================================================
-- AJOUT COLONNES TABLE pv_zones
-- ============================================================================

-- Image fond zone (upload manuel ou Google Maps URL)
ALTER TABLE pv_zones ADD COLUMN background_image_url TEXT;
ALTER TABLE pv_zones ADD COLUMN background_image_type TEXT DEFAULT 'upload' CHECK(background_image_type IN ('upload', 'google_maps', 'none'));

-- Dimensions zone en mètres (pour transformation coordonnées)
ALTER TABLE pv_zones ADD COLUMN width_meters REAL DEFAULT 50.0;
ALTER TABLE pv_zones ADD COLUMN height_meters REAL DEFAULT 30.0;

-- Configuration grille automatique
ALTER TABLE pv_zones ADD COLUMN grid_config TEXT; -- JSON: {rows, cols, spacing_x, spacing_y}

-- ============================================================================
-- AJOUT COLONNES TABLE pv_modules
-- ============================================================================

-- Status module (IDENTIQUE Module EL)
ALTER TABLE pv_modules ADD COLUMN module_status TEXT DEFAULT 'pending' CHECK(module_status IN (
  'ok', 'inequality', 'microcracks', 'dead', 'string_open', 'not_connected', 'pending'
));

-- Commentaire défaut (comme Module EL)
ALTER TABLE pv_modules ADD COLUMN status_comment TEXT;

-- ============================================================================
-- TABLE: pv_module_defects (Annotations défauts modules)
-- ============================================================================
-- Reprend EXACTEMENT le système Module EL
CREATE TABLE IF NOT EXISTS pv_module_defects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL,
  
  -- Status module (IDENTIQUE nomenclature Module EL)
  module_status TEXT NOT NULL DEFAULT 'pending' CHECK(module_status IN (
    'ok',              -- 🟢 Aucun défaut détecté
    'inequality',      -- 🟡 Inégalité qualité cellules
    'microcracks',     -- 🟠 Microfissures visibles EL
    'dead',            -- 🔴 Module défaillant HS
    'string_open',     -- 🔵 String ouvert / sous-string ouvert
    'not_connected',   -- ⚫ Non raccordé / non connecté
    'pending'          -- ⚪ En attente audit
  )),
  
  -- Commentaire défaut (champ texte libre comme Module EL)
  comment TEXT,
  
  -- Photo défaut (optionnel)
  photo_url TEXT,
  
  -- Métadonnées
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  detected_by TEXT, -- Nom technicien
  
  FOREIGN KEY (module_id) REFERENCES pv_modules(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE: pv_cartography_audit_links (Liaison PV ↔ EL Audits)
-- ============================================================================
-- Permet de lier une cartographie PV avec des audits EL
CREATE TABLE IF NOT EXISTS pv_cartography_audit_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  audit_token TEXT NOT NULL,
  
  -- Type de lien
  link_type TEXT DEFAULT 'import_config' CHECK(link_type IN (
    'import_config',  -- Import config cartographie → audit EL
    'export_results'  -- Export résultats audit EL → annotations cartographie
  )),
  
  -- Statut synchronisation
  sync_status TEXT DEFAULT 'pending' CHECK(sync_status IN ('pending', 'synced', 'error')),
  sync_error TEXT,
  
  -- Métadonnées
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (plant_id) REFERENCES pv_plants(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE,
  
  UNIQUE(plant_id, audit_token, link_type)
);

-- ============================================================================
-- INDEX PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_pv_module_defects_module_id ON pv_module_defects(module_id);
CREATE INDEX IF NOT EXISTS idx_pv_module_defects_status ON pv_module_defects(module_status);
CREATE INDEX IF NOT EXISTS idx_pv_cartography_links_plant ON pv_cartography_audit_links(plant_id);
CREATE INDEX IF NOT EXISTS idx_pv_cartography_links_audit ON pv_cartography_audit_links(audit_token);

-- ============================================================================
-- VALIDATION MIGRATION
-- ============================================================================
-- Vérification tables créées
SELECT 'Migration 0006 terminée - Tables créées:' as message;
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'pv_%' ORDER BY name;
