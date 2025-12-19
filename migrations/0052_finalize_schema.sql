-- Migration 0052: Finalisation Schema (Performance & Features V2)
-- 1. Ajout champs manuels pour Galerie Photos (Rapport V2)
-- 2. Index performance pour Assistant Vocal (Recherche module instantanée)

-- NOTE: SQLite ne supporte pas IF NOT EXISTS sur ADD COLUMN.
-- Cette migration assume que les colonnes n'existent pas encore (ce qui est le cas après check de 0021).

-- Ajout champs manuels Photos
ALTER TABLE el_photos ADD COLUMN manual_tag TEXT;
ALTER TABLE el_photos ADD COLUMN manual_comment TEXT;

-- Ajout Index Performance pour Assistant Vocal
-- Permet de trouver instantanément "String X Module Y"
CREATE INDEX IF NOT EXISTS idx_el_modules_identifier_lookup 
ON el_modules(audit_token, string_number, position_in_string);

-- Index additionnel pour recherche par identifiant textuel (ex: "S1-12")
CREATE INDEX IF NOT EXISTS idx_el_modules_string_id 
ON el_modules(audit_token, module_identifier);
