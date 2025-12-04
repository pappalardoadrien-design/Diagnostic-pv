-- Migration 0052: Ensure shared_configurations system (skip if columns exist)
-- Date: 2025-12-03
-- Correctif: Appliquer uniquement si migrations 0050/0051 n'ont pas été appliquées

-- ============================================================================
-- Créer shared_configurations (si n'existe pas déjà)
-- ============================================================================

CREATE TABLE IF NOT EXISTS shared_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Liens avec système unifié
  audit_id INTEGER,
  audit_token TEXT UNIQUE NOT NULL,
  
  -- Configuration Physique Simple
  string_count INTEGER,
  modules_per_string INTEGER,
  total_modules INTEGER NOT NULL,
  
  -- Configuration Physique Avancée (JSON)
  advanced_config JSON,
  is_advanced_mode BOOLEAN DEFAULT 0,
  
  -- Métadonnées Techniques
  module_model TEXT,
  module_power_wp INTEGER,
  total_power_kwc REAL,
  
  -- Configuration Système
  inverter_model TEXT,
  inverter_count INTEGER DEFAULT 1,
  installation_type TEXT,
  orientation TEXT,
  tilt_angle INTEGER,
  
  -- Statut et Validation
  validation_status TEXT DEFAULT 'draft',
  validated_by TEXT,
  validated_at DATETIME,
  
  -- Audit Trail
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shared_config_audit_token ON shared_configurations(audit_token);
CREATE INDEX IF NOT EXISTS idx_shared_config_audit_id ON shared_configurations(audit_id);

-- ============================================================================
-- Créer module_configuration_sync (si n'existe pas déjà)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_configuration_sync (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  config_id INTEGER NOT NULL,
  audit_token TEXT NOT NULL,
  
  module_type TEXT NOT NULL,
  module_table TEXT NOT NULL,
  
  sync_status TEXT DEFAULT 'pending',
  last_sync_at DATETIME,
  sync_error TEXT,
  
  config_snapshot JSON,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (config_id) REFERENCES shared_configurations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_config_id ON module_configuration_sync(config_id);
CREATE INDEX IF NOT EXISTS idx_sync_audit_token ON module_configuration_sync(audit_token);

-- Migration de données si nécessaire (depuis el_audits)
INSERT OR IGNORE INTO shared_configurations (
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
  'migration_0052' as created_by
FROM el_audits ea
LEFT JOIN audits a ON ea.audit_token = a.audit_token
WHERE ea.audit_token IS NOT NULL;

