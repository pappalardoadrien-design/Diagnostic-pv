-- Migration 0051: Système de Configuration Partagée Multi-Modules
-- Date: 2025-12-03
-- Auteur: DiagPV Hub - Architecture Unifiée
-- Objectif: Créer un système centralisé de gestion des configurations partagées entre modules

-- ============================================================================
-- Table: shared_configurations
-- ============================================================================
-- Stocke les configurations PV partagées entre tous les modules de diagnostic
-- Une configuration = définition physique de l'installation PV (strings, modules, puissance)
-- Liée à un audit master via audit_token

CREATE TABLE IF NOT EXISTS shared_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Liens avec système unifié
  audit_id INTEGER,
  audit_token TEXT UNIQUE NOT NULL,
  
  -- Configuration Physique Simple
  string_count INTEGER,                    -- Nombre total de strings
  modules_per_string INTEGER,              -- Modules par string (mode uniforme)
  total_modules INTEGER NOT NULL,          -- Total calculé
  
  -- Configuration Physique Avancée (JSON)
  advanced_config JSON,                    -- Format: {"strings": [{"id": 1, "modules": 24}, {"id": 2, "modules": 26}]}
  is_advanced_mode BOOLEAN DEFAULT 0,      -- 1 si config avancée activée
  
  -- Métadonnées Techniques
  module_model TEXT,                       -- Ex: "JKM450M-7RL4-V"
  module_power_wp INTEGER,                 -- Puissance crête par module (Wp)
  total_power_kwc REAL,                    -- Puissance totale (kWc) = total_modules * module_power_wp / 1000
  
  -- Configuration Système
  inverter_model TEXT,                     -- Modèle onduleur
  inverter_count INTEGER DEFAULT 1,        -- Nombre d'onduleurs
  installation_type TEXT,                  -- 'rooftop' | 'ground' | 'carport' | 'facade'
  orientation TEXT,                        -- 'south' | 'east-west' | 'north' | etc.
  tilt_angle INTEGER,                      -- Inclinaison (degrés)
  
  -- Statut et Validation
  validation_status TEXT DEFAULT 'draft',  -- 'draft' | 'validated' | 'locked'
  validated_by TEXT,                       -- Email du validateur
  validated_at DATETIME,                   -- Date de validation
  
  -- Audit Trail
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,                         -- Email du créateur
  
  -- Contraintes
  FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_shared_config_audit_token ON shared_configurations(audit_token);
CREATE INDEX IF NOT EXISTS idx_shared_config_audit_id ON shared_configurations(audit_id);
CREATE INDEX IF NOT EXISTS idx_shared_config_validation_status ON shared_configurations(validation_status);

-- ============================================================================
-- Fonction de Calcul Automatique (via Trigger)
-- ============================================================================
-- Recalcule total_modules et total_power_kwc à chaque modification

CREATE TRIGGER IF NOT EXISTS trg_calculate_shared_config_totals
AFTER INSERT ON shared_configurations
FOR EACH ROW
BEGIN
  UPDATE shared_configurations
  SET 
    total_modules = CASE 
      WHEN NEW.is_advanced_mode = 1 THEN 
        -- Calculer depuis JSON avancé
        (SELECT SUM(json_extract(value, '$.modules')) FROM json_each(NEW.advanced_config, '$.strings'))
      ELSE 
        -- Calculer depuis config simple
        NEW.string_count * NEW.modules_per_string
    END,
    total_power_kwc = CASE
      WHEN NEW.module_power_wp IS NOT NULL THEN
        CAST((NEW.total_modules * NEW.module_power_wp) AS REAL) / 1000.0
      ELSE NULL
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_update_shared_config_totals
AFTER UPDATE OF string_count, modules_per_string, advanced_config, module_power_wp ON shared_configurations
FOR EACH ROW
BEGIN
  UPDATE shared_configurations
  SET 
    total_modules = CASE 
      WHEN NEW.is_advanced_mode = 1 THEN 
        (SELECT SUM(json_extract(value, '$.modules')) FROM json_each(NEW.advanced_config, '$.strings'))
      ELSE 
        NEW.string_count * NEW.modules_per_string
    END,
    total_power_kwc = CASE
      WHEN NEW.module_power_wp IS NOT NULL THEN
        CAST((NEW.total_modules * NEW.module_power_wp) AS REAL) / 1000.0
      ELSE NULL
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- ============================================================================
-- Table: module_configuration_sync
-- ============================================================================
-- Suivi de synchronisation entre la config partagée et chaque module

CREATE TABLE IF NOT EXISTS module_configuration_sync (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  config_id INTEGER NOT NULL,
  audit_token TEXT NOT NULL,
  
  -- Identification Module
  module_type TEXT NOT NULL,               -- 'EL' | 'IV' | 'VISUAL' | 'ISOLATION' | 'PV_CARTO'
  module_table TEXT NOT NULL,              -- Nom de la table du module
  
  -- État de Synchronisation
  sync_status TEXT DEFAULT 'pending',      -- 'pending' | 'synced' | 'error'
  last_sync_at DATETIME,
  sync_error TEXT,                         -- Message d'erreur si échec
  
  -- Configuration Appliquée
  config_snapshot JSON,                    -- Snapshot de la config au moment de la sync
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (config_id) REFERENCES shared_configurations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_config_id ON module_configuration_sync(config_id);
CREATE INDEX IF NOT EXISTS idx_sync_audit_token ON module_configuration_sync(audit_token);
CREATE INDEX IF NOT EXISTS idx_sync_module_type ON module_configuration_sync(module_type);

-- ============================================================================
-- MIGRATION DE DONNÉES EXISTANTES
-- ============================================================================
-- Importer les configurations existantes depuis el_audits vers shared_configurations

INSERT INTO shared_configurations (
  audit_id,
  audit_token,
  string_count,
  modules_per_string,
  total_modules,
  advanced_config,
  is_advanced_mode,
  validation_status,
  created_at,
  created_by
)
SELECT 
  a.id as audit_id,
  ea.audit_token,
  ea.string_count,
  ea.modules_per_string,
  ea.total_modules,
  ea.configuration_json as advanced_config,
  CASE 
    WHEN ea.configuration_json IS NOT NULL AND ea.configuration_json != '' THEN 1 
    ELSE 0 
  END as is_advanced_mode,
  'validated' as validation_status,
  ea.created_at,
  'migration_0051' as created_by
FROM el_audits ea
LEFT JOIN audits a ON ea.audit_token = a.audit_token
WHERE ea.audit_token IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM shared_configurations sc WHERE sc.audit_token = ea.audit_token
  );

-- ============================================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================================

-- Cette migration crée le système de configuration partagée central pour DiagPV Hub
-- 
-- FONCTIONNALITÉS CLÉS:
-- 1. Une seule source de vérité pour la configuration physique PV
-- 2. Support des configurations simples (uniforme) ET avancées (strings non uniformes)
-- 3. Calcul automatique via triggers des totaux (modules, puissance)
-- 4. Traçabilité complète (qui/quand/quoi)
-- 5. Synchronisation trackée vers chaque module
-- 6. Migration automatique des données el_audits existantes
--
-- UTILISATION:
-- - Les modules lisent TOUJOURS depuis shared_configurations via audit_token
-- - Les modifications de config déclenchent auto-recalcul et notification modules
-- - La table module_configuration_sync permet de savoir si chaque module est à jour
--
-- COMPATIBILITÉ:
-- - Rétrocompatible avec les audits EL existants (migration automatique)
-- - Prêt pour modules futurs (IV, VISUAL, ISOLATION, PV_CARTO)
-- - Extensible via JSON pour nouveaux champs métiers

