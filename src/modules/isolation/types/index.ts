/**
 * Types TypeScript - Module Isolation
 * Conforme IEC 62446 - Tests d'isolement DC/AC
 */

// ============================================================================
// DATABASE RECORDS
// ============================================================================

export interface IsolationTestDBRecord {
  id: number;
  test_token: string;
  
  // Liaison audit/centrale
  plant_id: number | null;
  zone_id: number | null;
  audit_el_token: string | null;
  
  // Informations test
  test_date: string;
  test_type: string; // 'COMMISSIONING', 'MAINTENANCE', 'POST_INTERVENTION', 'POST_SINISTRE'
  operator_name: string | null;
  equipment_used: string | null;
  
  // Mesures isolement (en MegaOhms)
  dc_positive_to_earth: number | null;
  dc_negative_to_earth: number | null;
  dc_positive_to_negative: number | null;
  ac_to_earth: number | null;
  
  // Conditions mesure
  temperature_celsius: number | null;
  humidity_percent: number | null;
  weather_conditions: string | null;
  
  // Conformité IEC 62446
  is_conform: boolean;
  threshold_mohm: number;
  
  // Observations
  notes: string | null;
  non_conformity_details: string | null;
  corrective_actions: string | null;
  
  // Import Excel
  imported_from_file: string | null;
  raw_data_json: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface IsolationMeasurementHistoryDBRecord {
  id: number;
  test_id: number;
  test_token: string;
  measurement_type: string; // 'DC_POS_EARTH', 'DC_NEG_EARTH', 'DC_POS_NEG', 'AC_EARTH'
  measurement_value: number;
  is_conform: boolean;
  measured_at: string;
}

// ============================================================================
// APPLICATION MODELS
// ============================================================================

export type TestType = 'COMMISSIONING' | 'MAINTENANCE' | 'POST_INTERVENTION' | 'POST_SINISTRE';
export type MeasurementType = 'DC_POS_EARTH' | 'DC_NEG_EARTH' | 'DC_POS_NEG' | 'AC_EARTH';

export interface IsolationTest {
  id?: number;
  testToken: string;
  
  // Liaison audit/centrale
  plantId?: number;
  zoneId?: number;
  auditElToken?: string;
  
  // Informations test
  testDate: string;
  testType: TestType;
  operatorName?: string;
  equipmentUsed?: string;
  
  // Mesures isolement (MΩ)
  dcPositiveToEarth?: number;
  dcNegativeToEarth?: number;
  dcPositiveToNegative?: number;
  acToEarth?: number;
  
  // Conditions mesure
  temperatureCelsius?: number;
  humidityPercent?: number;
  weatherConditions?: string;
  
  // Conformité IEC 62446
  isConform: boolean;
  thresholdMohm: number;
  
  // Observations
  notes?: string;
  nonConformityDetails?: string;
  correctiveActions?: string;
  
  // Import Excel
  importedFromFile?: string;
  rawDataJson?: string;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  
  // Relations
  measurements?: IsolationMeasurementHistory[];
}

export interface IsolationMeasurementHistory {
  id?: number;
  testId: number;
  testToken: string;
  measurementType: MeasurementType;
  measurementValue: number;
  isConform: boolean;
  measuredAt: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateIsolationTestRequest {
  // Informations test (REQUIRED)
  testDate: string; // Format: YYYY-MM-DD
  testType: TestType;
  
  // Liaison audit/centrale (OPTIONAL)
  plantId?: number;
  zoneId?: number;
  auditElToken?: string;
  
  // Opérateur (OPTIONAL)
  operatorName?: string;
  equipmentUsed?: string; // Ex: 'Benning IT 130'
  
  // Mesures isolement (MΩ) - Au moins UNE mesure requise
  dcPositiveToEarth?: number;
  dcNegativeToEarth?: number;
  dcPositiveToNegative?: number;
  acToEarth?: number;
  
  // Conditions mesure (OPTIONAL)
  temperatureCelsius?: number;
  humidityPercent?: number;
  weatherConditions?: string;
  
  // Seuil conformité (DEFAULT: 1.0 MΩ)
  thresholdMohm?: number;
  
  // Observations (OPTIONAL)
  notes?: string;
  nonConformityDetails?: string;
  correctiveActions?: string;
}

export interface CreateIsolationTestResponse {
  success: boolean;
  test: IsolationTest;
  conformityStatus: {
    isConform: boolean;
    threshold: number;
    measurements: {
      type: MeasurementType;
      value: number;
      conform: boolean;
    }[];
  };
}

export interface UpdateIsolationTestRequest {
  // Mesures isolement (MΩ)
  dcPositiveToEarth?: number;
  dcNegativeToEarth?: number;
  dcPositiveToNegative?: number;
  acToEarth?: number;
  
  // Conditions mesure
  temperatureCelsius?: number;
  humidityPercent?: number;
  weatherConditions?: string;
  
  // Observations
  notes?: string;
  nonConformityDetails?: string;
  correctiveActions?: string;
  
  // Métadonnées
  operatorName?: string;
  equipmentUsed?: string;
}

export interface UpdateIsolationTestResponse {
  success: boolean;
  test: IsolationTest;
  conformityStatus: {
    isConform: boolean;
    changedFrom?: boolean; // Si conformité a changé
  };
}

export interface GetIsolationTestResponse {
  success: boolean;
  test: IsolationTest;
  measurements?: IsolationMeasurementHistory[];
}

export interface ListIsolationTestsRequest {
  plantId?: number;
  zoneId?: number;
  auditElToken?: string;
  testType?: TestType;
  isConform?: boolean;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  limit?: number;
  offset?: number;
}

export interface ListIsolationTestsResponse {
  success: boolean;
  tests: IsolationTest[];
  total: number;
  stats: {
    totalTests: number;
    conformTests: number;
    nonConformTests: number;
    conformityRate: number; // Pourcentage
  };
}

export interface ImportExcelRequest {
  plantId?: number;
  zoneId?: number;
  auditElToken?: string;
  operatorName?: string;
  excelData: {
    fileName: string;
    sheetData: ExcelMeasurement[];
  };
}

export interface ExcelMeasurement {
  testDate: string;
  equipmentUsed?: string;
  dcPositiveToEarth?: number;
  dcNegativeToEarth?: number;
  dcPositiveToNegative?: number;
  acToEarth?: number;
  temperatureCelsius?: number;
  humidityPercent?: number;
  weatherConditions?: string;
  notes?: string;
}

export interface ImportExcelResponse {
  success: boolean;
  imported: number;
  failed: number;
  tests: IsolationTest[];
  errors?: string[];
}

export interface GetPlantHistoryRequest {
  plantId: number;
  measurementType?: MeasurementType;
  startDate?: string;
  endDate?: string;
}

export interface GetPlantHistoryResponse {
  success: boolean;
  plantId: number;
  measurements: IsolationMeasurementHistory[];
  stats: {
    totalMeasurements: number;
    averageValue: number;
    minValue: number;
    maxValue: number;
    conformityRate: number;
    trend: 'stable' | 'improving' | 'degrading';
  };
}

// ============================================================================
// CONSTANTS & ENUMS
// ============================================================================

export const TEST_TYPES: Record<TestType, string> = {
  COMMISSIONING: 'Mise en service (Commissioning)',
  MAINTENANCE: 'Maintenance préventive annuelle',
  POST_INTERVENTION: 'Post-intervention (après réparation)',
  POST_SINISTRE: 'Post-sinistre (après incident)'
};

export const MEASUREMENT_TYPES: Record<MeasurementType, string> = {
  DC_POS_EARTH: 'DC+ vers Terre',
  DC_NEG_EARTH: 'DC- vers Terre',
  DC_POS_NEG: 'DC+ vers DC-',
  AC_EARTH: 'AC vers Terre'
};

export const DEFAULT_THRESHOLD_MOHM = 1.0; // IEC 62446 standard
export const MIN_THRESHOLD_MOHM = 0.5; // Minimum acceptable
export const RECOMMENDED_THRESHOLD_MOHM = 2.0; // Valeur recommandée DiagPV

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Vérifie si une mesure est conforme au seuil IEC 62446
 */
export function isMeasurementConform(value: number | null | undefined, threshold: number = DEFAULT_THRESHOLD_MOHM): boolean {
  if (value === null || value === undefined) return false;
  return value >= threshold;
}

/**
 * Calcule la conformité globale d'un test
 */
export function calculateTestConformity(
  measurements: {
    dcPositiveToEarth?: number;
    dcNegativeToEarth?: number;
    dcPositiveToNegative?: number;
    acToEarth?: number;
  },
  threshold: number = DEFAULT_THRESHOLD_MOHM
): boolean {
  const values = [
    measurements.dcPositiveToEarth,
    measurements.dcNegativeToEarth,
    measurements.dcPositiveToNegative,
    measurements.acToEarth
  ].filter(v => v !== null && v !== undefined);

  // Si aucune mesure, non-conforme
  if (values.length === 0) return false;

  // Toutes les mesures doivent être >= threshold
  return values.every(v => v! >= threshold);
}

/**
 * Génère un token unique pour un test
 */
export function generateTestToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `ISO_${timestamp}_${random}`;
}

/**
 * Convertit un DBRecord en modèle Application
 */
export function dbRecordToIsolationTest(record: IsolationTestDBRecord): IsolationTest {
  return {
    id: record.id,
    testToken: record.test_token,
    plantId: record.plant_id ?? undefined,
    zoneId: record.zone_id ?? undefined,
    auditElToken: record.audit_el_token ?? undefined,
    testDate: record.test_date,
    testType: record.test_type as TestType,
    operatorName: record.operator_name ?? undefined,
    equipmentUsed: record.equipment_used ?? undefined,
    dcPositiveToEarth: record.dc_positive_to_earth ?? undefined,
    dcNegativeToEarth: record.dc_negative_to_earth ?? undefined,
    dcPositiveToNegative: record.dc_positive_to_negative ?? undefined,
    acToEarth: record.ac_to_earth ?? undefined,
    temperatureCelsius: record.temperature_celsius ?? undefined,
    humidityPercent: record.humidity_percent ?? undefined,
    weatherConditions: record.weather_conditions ?? undefined,
    isConform: Boolean(record.is_conform),
    thresholdMohm: record.threshold_mohm,
    notes: record.notes ?? undefined,
    nonConformityDetails: record.non_conformity_details ?? undefined,
    correctiveActions: record.corrective_actions ?? undefined,
    importedFromFile: record.imported_from_file ?? undefined,
    rawDataJson: record.raw_data_json ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

/**
 * Convertit un DBRecord history en modèle Application
 */
export function dbRecordToMeasurementHistory(record: IsolationMeasurementHistoryDBRecord): IsolationMeasurementHistory {
  return {
    id: record.id,
    testId: record.test_id,
    testToken: record.test_token,
    measurementType: record.measurement_type as MeasurementType,
    measurementValue: record.measurement_value,
    isConform: Boolean(record.is_conform),
    measuredAt: record.measured_at
  };
}
