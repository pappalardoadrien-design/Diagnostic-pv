/**
 * Service de Configuration Partagée DiagPV Hub
 * =============================================
 * Gère la lecture et synchronisation des configurations PV entre tous les modules
 * 
 * @author DiagPV Hub
 * @date 2025-12-03
 * @version 1.0.0
 */

import type { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface SharedConfiguration {
  id: number;
  audit_id: number | null;
  audit_token: string;
  
  // Configuration Simple
  string_count: number | null;
  modules_per_string: number | null;
  total_modules: number;
  
  // Configuration Avancée
  advanced_config: string | null; // JSON stringifié
  is_advanced_mode: boolean;
  
  // Métadonnées Techniques
  module_model: string | null;
  module_power_wp: number | null;
  total_power_kwc: number | null;
  
  // Configuration Système
  inverter_model: string | null;
  inverter_count: number;
  installation_type: string | null;
  orientation: string | null;
  tilt_angle: number | null;
  
  // Statut
  validation_status: 'draft' | 'validated' | 'locked';
  validated_by: string | null;
  validated_at: string | null;
  
  // Audit Trail
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AdvancedConfigString {
  id: number;
  modules: number;
}

export interface AdvancedConfig {
  strings: AdvancedConfigString[];
}

export interface ModuleSyncStatus {
  module_type: string;
  sync_status: 'pending' | 'synced' | 'error';
  last_sync_at: string | null;
  config_snapshot: any;
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class SharedConfigService {
  constructor(private db: D1Database) {}

  /**
   * 🔍 Récupère la configuration partagée d'un audit
   */
  async getConfigByAuditToken(auditToken: string): Promise<SharedConfiguration | null> {
    const result = await this.db
      .prepare(`
        SELECT * FROM shared_configurations
        WHERE audit_token = ?
      `)
      .bind(auditToken)
      .first<SharedConfiguration>();

    return result || null;
  }

  /**
   * ✅ Crée ou met à jour une configuration partagée
   */
  async upsertConfiguration(config: {
    audit_token: string;
    audit_id?: number;
    string_count?: number;
    modules_per_string?: number;
    advanced_config?: AdvancedConfig;
    is_advanced_mode?: boolean;
    module_model?: string;
    module_power_wp?: number;
    created_by?: string;
  }): Promise<SharedConfiguration> {
    const existingConfig = await this.getConfigByAuditToken(config.audit_token);

    if (existingConfig) {
      // UPDATE
      const stmt = this.db.prepare(`
        UPDATE shared_configurations
        SET 
          string_count = COALESCE(?, string_count),
          modules_per_string = COALESCE(?, modules_per_string),
          advanced_config = COALESCE(?, advanced_config),
          is_advanced_mode = COALESCE(?, is_advanced_mode),
          module_model = COALESCE(?, module_model),
          module_power_wp = COALESCE(?, module_power_wp),
          updated_at = CURRENT_TIMESTAMP
        WHERE audit_token = ?
      `);

      await stmt.bind(
        config.string_count || null,
        config.modules_per_string || null,
        config.advanced_config ? JSON.stringify(config.advanced_config) : null,
        config.is_advanced_mode ? 1 : 0,
        config.module_model || null,
        config.module_power_wp || null,
        config.audit_token
      ).run();

      return (await this.getConfigByAuditToken(config.audit_token))!;
    } else {
      // INSERT
      const totalModules = config.advanced_config
        ? config.advanced_config.strings.reduce((sum, s) => sum + s.modules, 0)
        : (config.string_count || 0) * (config.modules_per_string || 0);

      const stmt = this.db.prepare(`
        INSERT INTO shared_configurations (
          audit_id, audit_token, string_count, modules_per_string, total_modules,
          advanced_config, is_advanced_mode, module_model, module_power_wp,
          validation_status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
      `);

      await stmt.bind(
        config.audit_id || null,
        config.audit_token,
        config.string_count || null,
        config.modules_per_string || null,
        totalModules,
        config.advanced_config ? JSON.stringify(config.advanced_config) : null,
        config.is_advanced_mode ? 1 : 0,
        config.module_model || null,
        config.module_power_wp || null,
        config.created_by || 'system'
      ).run();

      return (await this.getConfigByAuditToken(config.audit_token))!;
    }
  }

  /**
   * 📊 Parse la configuration avancée depuis JSON
   */
  parseAdvancedConfig(config: SharedConfiguration): AdvancedConfig | null {
    if (!config.advanced_config || !config.is_advanced_mode) {
      return null;
    }

    try {
      return JSON.parse(config.advanced_config);
    } catch (error) {
      console.error('❌ Erreur parsing advanced_config:', error);
      return null;
    }
  }

  /**
   * 🔄 Enregistre la synchronisation d'un module
   */
  async recordModuleSync(params: {
    audit_token: string;
    module_type: string;
    module_table: string;
    sync_status: 'pending' | 'synced' | 'error';
    sync_error?: string;
  }): Promise<void> {
    const config = await this.getConfigByAuditToken(params.audit_token);
    if (!config) {
      throw new Error(`Configuration introuvable pour audit_token: ${params.audit_token}`);
    }

    const stmt = this.db.prepare(`
      INSERT INTO module_configuration_sync (
        config_id, audit_token, module_type, module_table,
        sync_status, sync_error, last_sync_at, config_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    `);

    await stmt.bind(
      config.id,
      params.audit_token,
      params.module_type,
      params.module_table,
      params.sync_status,
      params.sync_error || null,
      JSON.stringify(config)
    ).run();
  }

  /**
   * 📈 Récupère le statut de sync de tous les modules d'un audit
   */
  async getModuleSyncStatus(auditToken: string): Promise<ModuleSyncStatus[]> {
    const results = await this.db
      .prepare(`
        SELECT 
          module_type,
          sync_status,
          last_sync_at,
          config_snapshot
        FROM module_configuration_sync
        WHERE audit_token = ?
        ORDER BY last_sync_at DESC
      `)
      .bind(auditToken)
      .all<ModuleSyncStatus>();

    return results.results || [];
  }

  /**
   * 🔒 Valider une configuration (verrouillage)
   */
  async validateConfiguration(auditToken: string, validatedBy: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE shared_configurations
        SET 
          validation_status = 'validated',
          validated_by = ?,
          validated_at = CURRENT_TIMESTAMP
        WHERE audit_token = ?
      `)
      .bind(validatedBy, auditToken)
      .run();
  }

  /**
   * 🔓 Déverrouiller une configuration
   */
  async unlockConfiguration(auditToken: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE shared_configurations
        SET validation_status = 'draft'
        WHERE audit_token = ?
      `)
      .bind(auditToken)
      .run();
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * 🔧 Calcule le total de modules depuis une configuration avancée
 */
export function calculateTotalModules(config: SharedConfiguration): number {
  if (config.is_advanced_mode && config.advanced_config) {
    try {
      const advancedConfig: AdvancedConfig = JSON.parse(config.advanced_config);
      return advancedConfig.strings.reduce((sum, s) => sum + s.modules, 0);
    } catch {
      return config.total_modules;
    }
  }

  if (config.string_count && config.modules_per_string) {
    return config.string_count * config.modules_per_string;
  }

  return config.total_modules;
}

/**
 * 📐 Calcule la puissance totale (kWc)
 */
export function calculateTotalPower(config: SharedConfiguration): number | null {
  if (!config.module_power_wp) return null;
  
  const totalModules = calculateTotalModules(config);
  return (totalModules * config.module_power_wp) / 1000;
}

/**
 * 🏗️ Génère une liste de modules depuis la configuration
 */
export function generateModulesList(config: SharedConfiguration): Array<{
  stringNumber: number;
  moduleNumber: number;
  identifier: string;
}> {
  const modules: Array<{ stringNumber: number; moduleNumber: number; identifier: string }> = [];

  if (config.is_advanced_mode && config.advanced_config) {
    try {
      const advancedConfig: AdvancedConfig = JSON.parse(config.advanced_config);
      advancedConfig.strings.forEach(string => {
        for (let i = 1; i <= string.modules; i++) {
          modules.push({
            stringNumber: string.id,
            moduleNumber: i,
            identifier: `S${string.id}-M${i}`
          });
        }
      });
    } catch (error) {
      console.error('❌ Erreur génération modules depuis advanced_config:', error);
    }
  } else if (config.string_count && config.modules_per_string) {
    for (let s = 1; s <= config.string_count; s++) {
      for (let m = 1; m <= config.modules_per_string; m++) {
        modules.push({
          stringNumber: s,
          moduleNumber: m,
          identifier: `S${s}-M${m}`
        });
      }
    }
  }

  return modules;
}
