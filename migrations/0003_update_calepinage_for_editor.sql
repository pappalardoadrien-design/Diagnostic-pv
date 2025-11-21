-- Migration pour améliorer le système calepinage avec éditeur visuel
-- Ajoute champs pour stocker layouts complets au format JSON

-- Ajouter colonnes manquantes à calepinage_layouts
ALTER TABLE calepinage_layouts ADD COLUMN module_type TEXT DEFAULT 'el';
ALTER TABLE calepinage_layouts ADD COLUMN view_box_json TEXT NOT NULL DEFAULT '{"width":2400,"height":1200,"gridSize":20}';
ALTER TABLE calepinage_layouts ADD COLUMN modules_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE calepinage_layouts ADD COLUMN arrows_json TEXT DEFAULT '[]';
ALTER TABLE calepinage_layouts ADD COLUMN zones_json TEXT DEFAULT '[]';

-- Nettoyer l'ancienne colonne layout_data si elle existe
-- (car on utilise maintenant des colonnes JSON séparées)
