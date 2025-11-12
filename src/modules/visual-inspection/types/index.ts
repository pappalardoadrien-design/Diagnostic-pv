/**
 * Types TypeScript - Module Controles Visuels
 * Conforme IEC 62446-1
 */

// ============================================================================
// DATABASE RECORDS
// ============================================================================

export interface VisualInspectionDBRecord {
  id: number;
  inspection_token: string;
  project_name: string;
  client_name: string;
  location: string;
  inspection_date: string;
  inspector_name: string | null;
  inspector_id: number | null;
  system_power_kwp: number | null;
  module_count: number | null;
  inverter_count: number | null;
  installation_year: number | null;
  overall_status: string;
  conformity_level: string;
  critical_issues_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface VisualInspectionItemDBRecord {
  id: number;
  inspection_id: number;
  inspection_token: string;
  category: string;
  subcategory: string | null;
  item_code: string;
  item_description: string;
  status: string;
  conformity: string;
  severity: string;
  observation: string | null;
  recommendation: string | null;
  photo_url: string | null;
  photo_count: number;
  checked_at: string | null;
  checked_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisualDefectDBRecord {
  id: number;
  inspection_id: number;
  inspection_token: string;
  item_id: number | null;
  defect_location: string;
  module_identifier: string | null;
  string_number: number | null;
  equipment_type: string;
  defect_type: string;
  defect_category: string;
  severity: string;
  urgency: string;
  description: string;
  potential_impact: string | null;
  recommended_action: string | null;
  norm_reference: string | null;
  norm_violation: boolean;
  image_url: string | null;
  image_count: number;
  detected_at: string;
  detected_by: string | null;
  resolved: boolean;
  resolved_at: string | null;
}

export interface VisualInspectionPhotoDBRecord {
  id: number;
  inspection_id: number;
  inspection_token: string;
  item_id: number | null;
  defect_id: number | null;
  photo_url: string;
  photo_type: string;
  caption: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
  file_size: number | null;
}

// ============================================================================
// APPLICATION MODELS
// ============================================================================

export type InspectionCategory = 'MECHANICAL' | 'ELECTRICAL' | 'DOCUMENTATION' | 'SAFETY';
export type ItemStatus = 'pending' | 'checked' | 'skipped';
export type ConformityStatus = 'pending' | 'conform' | 'non_conform' | 'not_applicable';
export type SeverityLevel = 'critical' | 'major' | 'minor' | 'info';
export type DefectUrgency = 'immediate' | 'urgent' | 'medium' | 'low';

export interface VisualInspection {
  id?: number;
  inspectionToken: string;
  projectName: string;
  clientName: string;
  location: string;
  inspectionDate: string;
  inspectorName?: string;
  inspectorId?: number;
  systemPowerKwp?: number;
  moduleCount?: number;
  inverterCount?: number;
  installationYear?: number;
  overallStatus: string;
  conformityLevel: string;
  criticalIssuesCount: number;
  items?: VisualInspectionItem[];
  defects?: VisualDefect[];
  completedAt?: string;
}

export interface VisualInspectionItem {
  id?: number;
  inspectionId?: number;
  inspectionToken: string;
  category: InspectionCategory;
  subcategory?: string;
  itemCode: string;
  itemDescription: string;
  status: ItemStatus;
  conformity: ConformityStatus;
  severity: SeverityLevel;
  observation?: string;
  recommendation?: string;
  photoUrl?: string;
  photoCount: number;
  checkedAt?: string;
  checkedBy?: string;
}

export interface VisualDefect {
  id?: number;
  inspectionId?: number;
  inspectionToken: string;
  itemId?: number;
  defectLocation: string;
  moduleIdentifier?: string;
  stringNumber?: number;
  equipmentType: string;
  defectType: string;
  defectCategory: string;
  severity: SeverityLevel;
  urgency: DefectUrgency;
  description: string;
  potentialImpact?: string;
  recommendedAction?: string;
  normReference?: string;
  normViolation: boolean;
  imageUrl?: string;
  imageCount: number;
  detectedAt?: string;
  detectedBy?: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface VisualInspectionPhoto {
  id?: number;
  inspectionId: number;
  inspectionToken: string;
  itemId?: number;
  defectId?: number;
  photoUrl: string;
  photoType: string;
  caption?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  fileSize?: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateInspectionRequest {
  projectName: string;
  clientName: string;
  location: string;
  inspectionDate: string;
  inspectorName?: string;
  systemPowerKwp?: number;
  moduleCount?: number;
  inverterCount?: number;
  installationYear?: number;
}

export interface CreateInspectionResponse {
  success: boolean;
  inspection: VisualInspection;
  itemsGenerated: number;
}

export interface UpdateItemRequest {
  status?: ItemStatus;
  conformity?: ConformityStatus;
  observation?: string;
  recommendation?: string;
  checkedBy?: string;
}

export interface UpdateItemResponse {
  success: boolean;
  item: VisualInspectionItem;
}

export interface CreateDefectRequest {
  itemId?: number;
  defectLocation: string;
  moduleIdentifier?: string;
  stringNumber?: number;
  equipmentType: string;
  defectType: string;
  defectCategory: string;
  severity: SeverityLevel;
  urgency: DefectUrgency;
  description: string;
  potentialImpact?: string;
  recommendedAction?: string;
  normReference?: string;
  normViolation?: boolean;
  detectedBy?: string;
}

export interface CreateDefectResponse {
  success: boolean;
  defect: VisualDefect;
}

// ============================================================================
// DEFECT TYPES ENUMS
// ============================================================================

export const DEFECT_TYPES = {
  MECHANICAL: [
    'module_crack',
    'module_delamination',
    'frame_corrosion',
    'backsheet_degradation',
    'junction_box_damage',
    'connector_wear',
    'structure_corrosion',
    'structure_deformation',
    'cable_damage',
    'cable_exposure'
  ],
  ELECTRICAL: [
    'loose_connection',
    'corrosion_terminals',
    'missing_protection',
    'faulty_fuse',
    'earth_discontinuity',
    'inverter_error',
    'missing_surge_protection',
    'incorrect_polarity'
  ],
  DOCUMENTATION: [
    'missing_labeling',
    'incorrect_labeling',
    'missing_schema',
    'missing_signage',
    'incomplete_documentation'
  ],
  SAFETY: [
    'access_risk',
    'fall_hazard',
    'electrical_hazard',
    'fire_risk',
    'vegetation_overgrowth',
    'shading_issue'
  ]
} as const;

export const EQUIPMENT_TYPES = [
  'module',
  'junction_box',
  'inverter',
  'cable',
  'structure',
  'connector',
  'protection_device',
  'earth_system',
  'documentation',
  'signage',
  'access_equipment'
] as const;

export type DefectType = typeof DEFECT_TYPES[keyof typeof DEFECT_TYPES][number];
export type EquipmentType = typeof EQUIPMENT_TYPES[number];
