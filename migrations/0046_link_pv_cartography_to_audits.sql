-- Migration 0046: Lier PV Cartography aux audits centralisés
-- Objectif: Créer connexion bidirectionnelle audits ↔ pv_zones/pv_modules
-- Date: 2025-11-24

-- ============================================================================
-- ÉTAPE 1: Ajouter colonnes de liaison dans pv_zones
-- ============================================================================

-- Lien vers table audits unifiée
ALTER TABLE pv_zones ADD COLUMN audit_token TEXT;
ALTER TABLE pv_zones ADD COLUMN audit_id INTEGER;

-- Métadonnées pour synchronisation
ALTER TABLE pv_zones ADD COLUMN sync_status TEXT DEFAULT 'manual' CHECK(sync_status IN ('manual', 'auto', 'synced', 'conflict'));
ALTER TABLE pv_zones ADD COLUMN last_sync_at DATETIME;
ALTER TABLE pv_zones ADD COLUMN sync_direction TEXT DEFAULT 'pv_to_audit' CHECK(sync_direction IN ('pv_to_audit', 'audit_to_pv', 'bidirectional'));

-- ============================================================================
-- ÉTAPE 2: Créer indexes pour performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pv_zones_audit_token ON pv_zones(audit_token);
CREATE INDEX IF NOT EXISTS idx_pv_zones_audit_id ON pv_zones(audit_id);
CREATE INDEX IF NOT EXISTS idx_pv_zones_sync_status ON pv_zones(sync_status);

-- ============================================================================
-- ÉTAPE 3: Ajouter colonnes dans pv_modules pour lien avec el_modules
-- ============================================================================

-- Colonnes potentiellement déjà existantes - ignorer erreurs
-- ALTER TABLE pv_modules ADD COLUMN el_module_id INTEGER;
-- ALTER TABLE pv_modules ADD COLUMN el_module_identifier TEXT;

-- Index (IF NOT EXISTS gère les doublons)
CREATE INDEX IF NOT EXISTS idx_pv_modules_el_module_id ON pv_modules(el_module_id);

-- ============================================================================
-- ÉTAPE 4: Ajouter colonnes dans audits pour lien inverse
-- ============================================================================

-- Permettre à un audit de pointer vers sa zone PV
ALTER TABLE audits ADD COLUMN pv_zone_id INTEGER;
ALTER TABLE audits ADD COLUMN pv_plant_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_audits_pv_zone ON audits(pv_zone_id);
CREATE INDEX IF NOT EXISTS idx_audits_pv_plant ON audits(pv_plant_id);

-- ============================================================================
-- COMMENTAIRES DOCUMENTATION
-- ============================================================================

-- pv_zones.audit_token : Lien vers audit EL/IV/Visual associé
-- pv_zones.audit_id : ID numérique audit (performance)
-- pv_zones.sync_status :
--   - 'manual' : Créé manuellement, pas de sync auto
--   - 'auto' : Sync automatique activée
--   - 'synced' : Données synchronisées
--   - 'conflict' : Conflit détecté (résolution manuelle)
-- pv_zones.sync_direction :
--   - 'pv_to_audit' : Position PV → Module EL
--   - 'audit_to_pv' : Module EL → Position PV
--   - 'bidirectional' : Sync bidirectionnelle

-- pv_modules.el_module_id : Lien vers el_modules.id
-- pv_modules.el_module_identifier : Ex: "S1-M15" (pour matching)

-- audits.pv_zone_id : Lien inverse audit → zone PV
-- audits.pv_plant_id : Lien inverse audit → centrale PV

-- ============================================================================
-- MIGRATION DONNÉES EXISTANTES (JALIBAT)
-- ============================================================================

-- Lier zone JALIBAT (id=4) avec audit JALIBAT (token=0e74eb29...)
UPDATE pv_zones 
SET audit_token = '0e74eb29-69d7-4923-8675-32dbb8e926d1',
    sync_status = 'manual',
    sync_direction = 'bidirectional'
WHERE id = 4 AND zone_name = 'JALIBAT';

-- Lier audit JALIBAT avec zone PV (lien inverse)
UPDATE audits
SET pv_zone_id = 4,
    pv_plant_id = 4
WHERE audit_token = '0e74eb29-69d7-4923-8675-32dbb8e926d1';

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================

-- Cette migration permet :
-- 1. Navigation Audit EL → Cartographie PV (via pv_zone_id)
-- 2. Navigation Cartographie PV → Audit EL (via audit_token)
-- 3. Synchronisation positions modules (el_modules ↔ pv_modules)
-- 4. Workflow complet : CRM → Projet → Intervention → Audit → PV Carto
-- 5. Traçabilité modifications (last_sync_at, sync_status)
