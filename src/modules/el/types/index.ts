// ============================================================================
// MODULE EL - TYPES TYPESCRIPT
// ============================================================================
// Module Électroluminescence (EL) - Définitions de types pour le schéma D1 unifié
// Adapté depuis le schéma 0004_drop_old_create_unified.sql

/**
 * Type audit EL complet avec toutes les informations
 * Table: el_audits
 */
export interface ELAudit {
  id: number
  intervention_id: number | null
  audit_token: string
  project_name: string
  client_name: string
  location: string | null
  string_count: number
  modules_per_string: number
  total_modules: number
  configuration_json: string | null
  plan_file_url: string | null
  status: 'created' | 'in_progress' | 'completed' | 'cancelled'
  completion_rate: number
  created_at: string
  updated_at: string
}

/**
 * Type module EL avec diagnostic
 * Table: el_modules
 */
export interface ELModule {
  id: number
  el_audit_id: number
  audit_token: string
  module_identifier: string
  string_number: number
  position_in_string: number
  defect_type: 'none' | 'pending' | 'microcrack' | 'dead_module' | 'luminescence_inequality' | 'string_open' | 'bypass_diode_failure' | 'not_connected'
  severity_level: 0 | 1 | 2 | 3
  technician_comment: string | null
  technician_id: number | null
  physical_row: number | null
  physical_col: number | null
  created_at: string
  updated_at: string
}

/**
 * Mapping ancien schéma → nouveau schéma pour rétrocompatibilité
 */
export const OLD_STATUS_MAPPING: Record<string, { defect_type: string; severity_level: number }> = {
  'ok': { defect_type: 'none', severity_level: 0 },
  'pending': { defect_type: 'pending', severity_level: 0 },
  'inequality': { defect_type: 'luminescence_inequality', severity_level: 1 },
  'microcracks': { defect_type: 'microcrack', severity_level: 2 },
  'dead': { defect_type: 'dead_module', severity_level: 3 },
  'string_open': { defect_type: 'string_open', severity_level: 2 },
  'not_connected': { defect_type: 'not_connected', severity_level: 2 }
}

/**
 * Statistiques d'un audit EL (calculées depuis v_el_audit_statistics)
 */
export interface ELAuditStatistics {
  audit_id: number
  audit_token: string
  project_name: string
  client_name: string
  total_modules: number
  completion_rate: number
  status: string
  modules_diagnosed: number
  modules_ok: number
  modules_microcrack: number
  modules_dead: number
  modules_inequality: number
  modules_critical: number
  created_at: string
  updated_at: string
}

/**
 * Configuration JSON pour l'audit (format DiagPV)
 */
export interface ELAuditConfiguration {
  mode: 'simple' | 'advanced'
  stringCount?: number
  modulesPerString?: number
  totalModules?: number
  strings?: Array<{
    id: number
    mpptNumber?: number
    moduleCount: number
    physicalRow?: number
    physicalCol?: number
  }>
}

/**
 * Format JSON d'import DiagPV (rétrocompatibilité)
 */
export interface DiagPVImportFormat {
  diagpv_import_format: {
    project_name: string
    client_name: string
    location: string
    string_count: number
    modules_per_string: number
    total_modules: number
  }
  strings_configuration?: Array<{
    string_number: number
    modules: Array<{
      position_in_string: number
      physical_position?: {
        row: number
        col: number
      }
    }>
  }>
}

/**
 * Progrès d'un audit (statistiques en temps réel)
 */
export interface ELAuditProgress {
  total: number
  completed: number
  ok: number
  microcrack: number
  dead: number
  inequality: number
  string_open: number
  not_connected: number
  pending: number
}

/**
 * Session collaborative (KV store)
 */
export interface CollaborativeSession {
  lastUpdate: number
  moduleId?: string
  status?: string
  technicianId?: string | null
  bulkUpdate?: {
    modules: string[]
    status: string
    count: number
  }
}

/**
 * Requête création audit
 */
export interface CreateAuditRequest {
  projectName: string
  clientName: string
  location: string
  configuration?: ELAuditConfiguration
  // Rétrocompatibilité ancien format
  stringCount?: number
  modulesPerString?: number
}

/**
 * Requête mise à jour module
 */
export interface UpdateModuleRequest {
  status: string
  comment?: string | null
  technicianId?: string | null
}

/**
 * Requête bulk update
 */
export interface BulkUpdateRequest {
  modules: string[]
  status: string
  comment?: string | null
  technician_id?: string | null
}

/**
 * Réponse API standard
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
