-- Migration 0027: Ajouter configuration PV complète aux projets/sites
-- Permet de stocker la configuration technique détaillée (onduleurs, BJ, strings)
-- Compatible avec le format du module EL pour cohérence

-- Ajouter colonnes configuration PV
ALTER TABLE projects ADD COLUMN inverter_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN inverter_brand TEXT;
ALTER TABLE projects ADD COLUMN junction_box_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN strings_configuration TEXT; -- JSON format identique module EL

-- Ajouter description et notes techniques
ALTER TABLE projects ADD COLUMN technical_notes TEXT;

-- Commentaires pour documentation
-- inverter_count: Nombre d'onduleurs sur le site
-- inverter_brand: Marque/modèle des onduleurs (ex: "Huawei SUN2000-100KTL")
-- junction_box_count: Nombre de boîtes de jonction
-- strings_configuration: JSON avec configuration détaillée des strings par MPPT
--   Format: {"mode": "advanced", "strings": [{"mpptNumber": 1, "moduleCount": 20}, ...]}
--   Compatible avec le format du module EL (configuration_json)
-- technical_notes: Notes techniques complémentaires sur l'installation
