-- Migration 0015: Creation tables Module IV - Courbes I-V
-- Date: 2025-11-12
-- Description: Tables IV curves sans commentaires UTF-8

CREATE TABLE IF NOT EXISTS iv_curves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  el_audit_id INTEGER,
  audit_token TEXT,
  string_number INTEGER NOT NULL,
  curve_type TEXT NOT NULL DEFAULT 'dark',
  measurement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  technician_id INTEGER,
  device_name TEXT,
  serial_number TEXT,
  fill_factor REAL,
  rds REAL,
  uf_diodes INTEGER,
  ur REAL,
  isc REAL,
  voc REAL,
  pmax REAL,
  vmpp REAL,
  impp REAL,
  rs REAL,
  rsh REAL,
  status TEXT DEFAULT 'pending',
  anomaly_detected BOOLEAN DEFAULT 0,
  anomaly_type TEXT,
  source_filename TEXT,
  source_file_url TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iv_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  iv_curve_id INTEGER NOT NULL,
  voltage REAL NOT NULL,
  current REAL NOT NULL,
  power REAL,
  measurement_order INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_iv_curves_audit ON iv_curves(el_audit_id);
CREATE INDEX IF NOT EXISTS idx_iv_curves_audit_token ON iv_curves(audit_token);
CREATE INDEX IF NOT EXISTS idx_iv_curves_string ON iv_curves(string_number);
CREATE INDEX IF NOT EXISTS idx_iv_curves_status ON iv_curves(status);
CREATE INDEX IF NOT EXISTS idx_iv_curves_anomaly ON iv_curves(anomaly_detected);
