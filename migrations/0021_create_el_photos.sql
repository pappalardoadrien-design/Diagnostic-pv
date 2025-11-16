-- Migration 0021: Create el_photos table for Picsellia AI integration
-- Table isolée pour stockage métadonnées photos EL
-- N'affecte AUCUNE table existante (architecture additive)

CREATE TABLE IF NOT EXISTS el_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identification
  audit_token TEXT NOT NULL,
  module_id TEXT NOT NULL,              -- Ex: "M001", "S01-M12"
  string_number INTEGER NOT NULL,
  
  -- Stockage photos
  photo_url TEXT NOT NULL,              -- R2 URL photo originale
  photo_annotated_url TEXT,             -- R2 URL photo annotée par IA Picsellia
  photo_thumbnail_url TEXT,             -- R2 URL miniature (pour affichage rapide)
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  uploaded_by TEXT,                     -- Nom auditeur
  
  -- Analyse IA Picsellia (préparation future)
  ai_analyzed BOOLEAN DEFAULT 0,
  ai_analyzed_at DATETIME,
  ai_confidence REAL,                   -- Score confiance global 0.0 à 1.0
  ai_defects_detected TEXT,             -- JSON array défauts détectés par IA
  ai_status TEXT DEFAULT 'pending',     -- 'pending', 'analyzing', 'completed', 'failed'
  ai_error TEXT,                        -- Message erreur si échec analyse
  ai_processing_time_ms INTEGER,        -- Temps traitement IA (ms)
  
  -- Validation humaine (future)
  human_validated BOOLEAN DEFAULT 0,
  validated_by TEXT,                    -- Nom validateur
  validated_at DATETIME,
  validation_notes TEXT,                -- Remarques validation
  validation_action TEXT,               -- 'accepted', 'corrected', 'rejected'
  
  -- Métadonnées fichier
  file_name TEXT NOT NULL,              -- Nom fichier original
  file_size INTEGER,                    -- Taille en bytes
  file_type TEXT,                       -- MIME type (image/jpeg, image/png)
  image_width INTEGER,                  -- Largeur image pixels
  image_height INTEGER,                 -- Hauteur image pixels
  exif_data TEXT,                       -- JSON métadonnées EXIF (date, appareil, GPS, etc.)
  
  -- Métadonnées audit
  audit_date DATE,                      -- Date audit (dénormalisé pour queries rapides)
  location TEXT,                        -- Localisation centrale (dénormalisé)
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Contraintes
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE,
  UNIQUE(audit_token, module_id)        -- Une seule photo par module
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_el_photos_audit ON el_photos(audit_token);
CREATE INDEX IF NOT EXISTS idx_el_photos_string ON el_photos(audit_token, string_number);
CREATE INDEX IF NOT EXISTS idx_el_photos_ai_status ON el_photos(ai_status);
CREATE INDEX IF NOT EXISTS idx_el_photos_ai_analyzed ON el_photos(ai_analyzed);
CREATE INDEX IF NOT EXISTS idx_el_photos_validated ON el_photos(human_validated);
CREATE INDEX IF NOT EXISTS idx_el_photos_uploaded_at ON el_photos(uploaded_at DESC);

-- Trigger pour mise à jour automatique updated_at
CREATE TRIGGER IF NOT EXISTS update_el_photos_timestamp 
AFTER UPDATE ON el_photos
BEGIN
  UPDATE el_photos SET updated_at = datetime('now') WHERE id = NEW.id;
END;
