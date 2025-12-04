-- Migration: 0056_pdf_reports_table.sql
-- Description: Table pour historique des rapports PDF générés
-- Date: 2025-12-04
-- Phase: 10.1 - Infrastructure PDF

-- Table pour historique PDF
CREATE TABLE IF NOT EXISTS pdf_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_token TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'el', 'iv', 'thermique', 'visual', 'isolation', 'multi-modules'
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  file_size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Index pour recherches rapides
  FOREIGN KEY (audit_token) REFERENCES el_audits(audit_token) ON DELETE CASCADE
);

-- Index pour recherches par audit_token
CREATE INDEX IF NOT EXISTS idx_pdf_reports_audit_token 
ON pdf_reports(audit_token);

-- Index pour recherches par type
CREATE INDEX IF NOT EXISTS idx_pdf_reports_type 
ON pdf_reports(report_type);

-- Index pour recherches par date
CREATE INDEX IF NOT EXISTS idx_pdf_reports_created_at 
ON pdf_reports(created_at DESC);

-- Commentaire
-- Cette table permet de:
-- 1. Historiser tous les PDF générés par audit
-- 2. Retrouver rapidement un PDF via audit_token
-- 3. Tracker les types de rapports générés
-- 4. Connaître la taille des fichiers stockés en R2
