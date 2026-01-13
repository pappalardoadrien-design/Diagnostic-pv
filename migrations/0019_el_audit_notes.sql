-- Migration: Create el_audit_notes table for audit notes
-- Required for voice notes and text notes on terrain

CREATE TABLE IF NOT EXISTS el_audit_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  el_audit_id INTEGER NOT NULL,
  audit_token TEXT NOT NULL,
  note_type TEXT DEFAULT 'text' CHECK(note_type IN ('text', 'voice', 'photo')),
  content TEXT,
  audio_url TEXT,
  photo_url TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (el_audit_id) REFERENCES el_audits(id) ON DELETE CASCADE
);

-- Index pour recherche rapide par audit
CREATE INDEX IF NOT EXISTS idx_el_audit_notes_audit ON el_audit_notes(el_audit_id);
CREATE INDEX IF NOT EXISTS idx_el_audit_notes_token ON el_audit_notes(audit_token);
