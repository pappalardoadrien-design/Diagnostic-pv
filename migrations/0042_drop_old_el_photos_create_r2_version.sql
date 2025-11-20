-- ============================================================================
-- MIGRATION 0042: Drop old el_photos + Create new R2 version
-- ============================================================================
-- L'ancienne table el_photos utilisait photo_url (URLs externes)
-- La nouvelle version utilise Cloudflare R2 pour stockage natif
-- ============================================================================

-- Drop old table and its views/indexes
DROP VIEW IF EXISTS v_el_photos_stats;
DROP INDEX IF EXISTS idx_el_photos_r2_key;
DROP INDEX IF EXISTS idx_el_photos_severity;
DROP INDEX IF EXISTS idx_el_photos_defect;
DROP INDEX IF EXISTS idx_el_photos_type;
DROP INDEX IF EXISTS idx_el_photos_audit;
DROP INDEX IF EXISTS idx_el_photos_module;
DROP TABLE IF EXISTS el_photos;

-- Create new table with R2 storage
CREATE TABLE el_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  el_module_id INTEGER NOT NULL,
  audit_token TEXT NOT NULL,
  module_identifier TEXT NOT NULL,
  
  -- Stockage R2
  r2_key TEXT NOT NULL UNIQUE,
  r2_url TEXT NOT NULL,
  
  -- Métadonnées photo
  photo_type TEXT NOT NULL DEFAULT 'defect', -- defect, overview, detail, comparison
  defect_category TEXT, -- microcracks, hotspot, pid, bypass_diode, snail_trail, delamination
  severity_level INTEGER DEFAULT 0, -- 0=none, 1=minor, 2=moderate, 3=severe, 4=critical
  
  -- Données techniques
  description TEXT,
  technician_notes TEXT,
  capture_date DATETIME,
  file_size INTEGER,
  mime_type TEXT,
  
  -- GPS et contexte
  gps_latitude REAL,
  gps_longitude REAL,
  string_number INTEGER,
  position_in_string INTEGER,
  
  -- Métadonnées système
  uploaded_by INTEGER, -- auth_user_id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (el_module_id) REFERENCES el_modules(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES auth_users(id) ON DELETE SET NULL
);

-- Index pour performance
CREATE INDEX idx_el_photos_module ON el_photos(el_module_id);
CREATE INDEX idx_el_photos_audit ON el_photos(audit_token);
CREATE INDEX idx_el_photos_type ON el_photos(photo_type);
CREATE INDEX idx_el_photos_defect ON el_photos(defect_category);
CREATE INDEX idx_el_photos_severity ON el_photos(severity_level);
CREATE INDEX idx_el_photos_r2_key ON el_photos(r2_key);

-- Vue statistiques photos par audit
CREATE VIEW v_el_photos_stats AS
SELECT 
  audit_token,
  COUNT(*) as total_photos,
  COUNT(DISTINCT el_module_id) as modules_with_photos,
  COUNT(CASE WHEN photo_type = 'defect' THEN 1 END) as defect_photos,
  COUNT(CASE WHEN severity_level >= 3 THEN 1 END) as critical_photos,
  SUM(file_size) as total_storage_bytes,
  MAX(created_at) as last_upload
FROM el_photos
GROUP BY audit_token;
