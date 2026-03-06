-- Migration 0068: Remove legacy is_girasole column from projects
-- Date: 2026-03-06
-- Cleanup: suppression definitive des references GIRASOLE

-- SQLite ne supporte pas DROP COLUMN avant 3.35.0
-- Cloudflare D1 utilise SQLite 3.40+ donc DROP COLUMN est supporté
ALTER TABLE projects DROP COLUMN is_girasole;
