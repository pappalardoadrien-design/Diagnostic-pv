// Types pour le système de rapports flexibles

export type ModuleCode = 'el' | 'thermal' | 'iv_curves' | 'visual' | 'isolation';

export interface ReportTemplate {
  id: number;
  template_code: string;
  display_name: string;
  description: string;
  modules_required: string; // JSON string array
  modules_optional: string; // JSON string array
  conformity_weights: string; // JSON string object
  report_sections: string; // JSON string array
  is_active: boolean;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface ConformityWeights {
  [moduleCode: string]: number; // 0.0 to 1.0
}

export interface CustomReportRequest {
  template_code: string;
  plant_id: number;
  modules_selected: ModuleCode[];
  report_title: string;
  client_name: string;
  audit_date: string;
  auditor_name?: string;
  custom_weights?: ConformityWeights; // For 'custom' template
  notes?: string;
}

export interface ModuleAvailability {
  module_code: ModuleCode;
  available: boolean;
  count: number;
  latest_date?: string;
  message: string;
}

export interface DataAvailabilityResponse {
  plant_id: number;
  plant_name?: string;
  modules: ModuleAvailability[];
  ready_to_generate: boolean;
}

// Module-specific data structures
export interface ELModuleData {
  audit_token: string;
  total_modules: number;
  ok_count: number;
  defects_count: number;
  conformity_rate: number;
  defect_stats: {
    inequalities: number;
    microcracks: number;
    hs: number;
    string_open: number;
    not_connected: number;
  };
}

export interface VisualModuleData {
  inspection_token: string;
  total_items: number;
  conform_count: number;
  non_conform_count: number;
  conformity_rate: number;
  critical_issues: Array<{
    category: string;
    item: string;
    status: string;
    remarks?: string;
  }>;
}

export interface IVModuleData {
  total_curves: number;
  avg_ff: number;
  avg_rds: number;
  out_of_tolerance_count: number;
  conformity_rate: number;
  curves: Array<{
    module_position: string;
    string_number: number;
    ff: number;
    rds: number;
    voc: number;
    isc: number;
    pmax: number;
  }>;
}

export interface IsolationModuleData {
  total_tests: number;
  conform_count: number;
  non_conform_count: number;
  conformity_rate: number;
  avg_dc_positive_to_earth: number;
  avg_dc_negative_to_earth: number;
  latest_test_date: string;
}

export interface ThermalModuleData {
  audit_token: string;
  total_modules: number;
  hotspot_count: number;
  bypass_diode_count: number;
  conformity_rate: number;
  thermal_stats: {
    avg_temp: number;
    max_temp: number;
    delta_temp: number;
  };
}

export interface CustomReportData {
  template: ReportTemplate;
  plant_name: string;
  report_title: string;
  client_name: string;
  audit_date: string;
  auditor_name: string;
  overall_conformity_rate: number;
  critical_issues_count: number;
  major_issues_count: number;
  minor_issues_count: number;
  modules_data: {
    el?: ELModuleData;
    visual?: VisualModuleData;
    iv_curves?: IVModuleData;
    isolation?: IsolationModuleData;
    thermal?: ThermalModuleData;
  };
  conformity_weights: ConformityWeights;
  generated_at: string;
  generated_by: string;
}

export interface CustomReportResponse {
  success: boolean;
  report_token?: string;
  overall_conformity_rate?: number;
  modules_included?: ModuleCode[];
  error?: string;
}
