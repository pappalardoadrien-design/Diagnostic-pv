-- Création table notes audit EL (Notes vocales / générales)
CREATE TABLE IF NOT EXISTS el_audit_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  content TEXT NOT NULL,
  technician_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_el_audit_notes_token ON el_audit_notes(audit_token);
