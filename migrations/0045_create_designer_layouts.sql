-- ============================================================
-- MIGRATION: Création table designer_layouts
-- Date: 2024-10-23
-- Projet: DiagPV - Module Designer Satellite
-- Description: Stockage designs calepinage modules photovoltaïques
-- ============================================================

-- Création table principale
CREATE TABLE IF NOT EXISTS designer_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  modules_count INTEGER NOT NULL,
  modules_data TEXT NOT NULL,      -- JSON: [{lat, lng, status, rotation, width, height}]
  module_specs TEXT NOT NULL,      -- JSON: {width, height, spacing}
  map_center TEXT NOT NULL,        -- JSON: {lat, lng, zoom}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance requêtes par date
CREATE INDEX IF NOT EXISTS idx_designer_layouts_created_at 
ON designer_layouts(created_at DESC);

-- Index pour performance requêtes par nombre de modules
CREATE INDEX IF NOT EXISTS idx_designer_layouts_count 
ON designer_layouts(modules_count);

-- ============================================================
-- COMMENTAIRES COLONNES
-- ============================================================
-- id              : Identifiant unique auto-incrémenté
-- modules_count   : Nombre total de modules dans le design
-- modules_data    : Tableau JSON des modules placés
--                   Exemple: [{"lat":43.6108,"lng":1.4534,"status":"ok","rotation":0,"width":1.7,"height":1.0}]
-- module_specs    : Spécifications dimensions modules
--                   Exemple: {"width":1.7,"height":1.0,"spacing":0.02}
-- map_center      : Position/zoom carte pour restauration
--                   Exemple: {"lat":43.6108,"lng":1.4534,"zoom":20}
-- created_at      : Timestamp création automatique

-- ============================================================
-- NOTES D'IMPLÉMENTATION
-- ============================================================
-- 1. Format JSON permet flexibilité évolution schéma
-- 2. Index created_at pour historique chronologique
-- 3. Index modules_count pour filtres statistiques
-- 4. TEXT type suffisant pour JSON (max 1 milliard caractères SQLite)
-- 5. Pas de clé étrangère project_id (standalone pour MVP)

-- ============================================================
-- COMMANDES DÉPLOIEMENT
-- ============================================================
-- Développement local:
--   npx wrangler d1 execute diagpv-db --local --file=./migrations/0004_create_designer_layouts.sql
--
-- Production:
--   npx wrangler d1 execute diagpv-db --file=./migrations/0004_create_designer_layouts.sql
--
-- Vérification:
--   npx wrangler d1 execute diagpv-db --local --command="SELECT * FROM sqlite_master WHERE type='table' AND name='designer_layouts';"
-- ============================================================
