-- ============================================================================
-- TABLE PHOTOS - Stockage photos terrain
-- ============================================================================
-- Photos capturées sur le terrain avec géolocalisation
-- Stockage base64 pour simplicité (D1 supporte jusqu'à ~1MB par row)
-- ============================================================================

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  module_type TEXT NOT NULL DEFAULT 'GENERAL', -- EL, IV, VISUAL, ISOLATION, GENERAL
  photo_data TEXT NOT NULL, -- Base64 data URL (data:image/jpeg;base64,...)
  photo_format TEXT NOT NULL, -- jpeg, png, webp
  photo_size INTEGER NOT NULL, -- Taille en bytes
  description TEXT,
  string_number INTEGER,
  module_number INTEGER,
  latitude REAL,
  longitude REAL,
  gps_accuracy REAL, -- Précision GPS en mètres
  captured_at DATETIME, -- Timestamp capture (peut différer de created_at)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (audit_token) REFERENCES audits(audit_token) ON DELETE CASCADE
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_photos_audit_token ON photos(audit_token);
CREATE INDEX IF NOT EXISTS idx_photos_module_type ON photos(module_type);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);

-- ============================================================================
-- NOTES IMPLÉMENTATION
-- ============================================================================
-- Base64 storage: Simple mais limité à ~1MB par photo
-- Pour photos HD (>1MB), envisager:
--   1. Cloudflare R2 storage + URL reference
--   2. Chunking du base64 sur plusieurs rows
--   3. Compression agressive côté client
-- 
-- Format recommandé: JPEG avec quality 0.7-0.8 (bon compromis taille/qualité)
-- ============================================================================
