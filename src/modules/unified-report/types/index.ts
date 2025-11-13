/**
 * Types TypeScript - Module Rapport Unifié
 * Agrégation multi-modules: EL + IV + Visuels + Isolation + Thermique
 */

// ============================================================================
// MODULE EL - ÉLECTROLUMINESCENCE
// ============================================================================

export interface ELModuleData {
  hasData: boolean;
  auditToken: string;
  projectName: string;
  clientName: string;
  location: string;
  auditDate: string;
  totalModules: number;
  stats: {
    ok: number;
    inequality: number;
    microcracks: number;
    dead: number;
    string_open: number;
    not_connected: number;
  };
  conformityRate: number; // Pourcentage OK
  criticalDefects: Array<{
    moduleId: string;
    status: string;
    comment: string | null;
  }>;
}

// ============================================================================
// MODULE IV - COURBES I-V
// ============================================================================

export interface IVModuleData {
  hasData: boolean;
  totalCurves: number;
  avgFF: number; // Fill Factor moyen
  avgRds: number; // Résistance série moyenne
  avgUf: number; // Tension de fonctionnement moyenne
  outOfToleranceCount: number;
  curves: Array<{
    stringNumber: number;
    moduleNumber: number;
    ff: number;
    rds: number;
    uf: number;
    isValid: boolean;
  }>;
}

// ============================================================================
// MODULE VISUELS - CONTRÔLES IEC 62446-1
// ============================================================================

export interface VisualModuleData {
  hasData: boolean;
  inspectionToken: string;
  projectName: string;
  inspectionDate: string;
  checklist: {
    totalItems: number;
    checkedItems: number;
    conformItems: number;
    nonConformItems: number;
    conformityRate: number;
  };
  defects: Array<{
    id: number;
    location: string;
    equipmentType: string;
    defectType: string;
    severity: 'critical' | 'major' | 'minor';
    description: string;
    recommendedAction: string | null;
  }>;
  criticalDefectsCount: number;
}

// ============================================================================
// MODULE ISOLATION - TESTS DC/AC
// ============================================================================

export interface IsolationModuleData {
  hasData: boolean;
  totalTests: number;
  conformTests: number;
  nonConformTests: number;
  conformityRate: number;
  latestTest: {
    testToken: string;
    testDate: string;
    dcPositiveToEarth: number | null;
    dcNegativeToEarth: number | null;
    dcPositiveToNegative: number | null;
    acToEarth: number | null;
    isConform: boolean;
  } | null;
  avgMeasurements: {
    dcPosEarth: number;
    dcNegEarth: number;
    dcPosNeg: number;
    acEarth: number;
  };
}

// ============================================================================
// MODULE THERMIQUE - THERMOGRAPHIE IR
// ============================================================================

export interface ThermalModuleData {
  hasData: boolean;
  reportUrl: string | null; // URL PDF sous-traitant
  hotSpotsCount: number | null;
  summary: string | null;
}

// ============================================================================
// RAPPORT UNIFIÉ - AGRÉGATION
// ============================================================================

export interface UnifiedReportData {
  // Métadonnées générales
  reportToken: string;
  plantId: number | null;
  plantName: string;
  clientName: string;
  location: string;
  generatedAt: string;
  generatedBy: string | null;
  
  // Données modules
  elModule: ELModuleData;
  ivModule: IVModuleData;
  visualModule: VisualModuleData;
  isolationModule: IsolationModuleData;
  thermalModule: ThermalModuleData;
  
  // Synthèse globale
  summary: {
    totalModulesAudited: number;
    overallConformityRate: number;
    criticalIssuesCount: number;
    majorIssuesCount: number;
    minorIssuesCount: number;
    urgentActionsRequired: boolean;
  };
  
  // Recommandations
  recommendations: Array<{
    priority: 'urgent' | 'high' | 'medium' | 'low';
    category: 'safety' | 'performance' | 'maintenance' | 'documentation';
    title: string;
    description: string;
    estimatedImpact: string | null; // kWh/an, €/an
    deadline: string | null;
  }>;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GenerateUnifiedReportRequest {
  plantId?: number;
  auditElToken?: string; // Si rapport basé sur audit EL spécifique
  inspectionToken?: string; // Si rapport basé sur inspection visuelle
  includeModules?: ('el' | 'iv' | 'visual' | 'isolation' | 'thermal')[];
  generatedBy?: string;
  additionalNotes?: string;
}

export interface GenerateUnifiedReportResponse {
  success: boolean;
  reportToken: string;
  reportData: UnifiedReportData;
  htmlContent: string; // Template HTML généré
  pdfUrl?: string; // URL PDF si généré côté serveur
}

export interface GetUnifiedReportResponse {
  success: boolean;
  reportData: UnifiedReportData;
  htmlContent: string;
}

export interface PreviewAvailableDataRequest {
  plantId?: number;
  auditElToken?: string;
}

export interface PreviewAvailableDataResponse {
  success: boolean;
  plantId: number | null;
  plantName: string | null;
  availableModules: {
    el: boolean;
    iv: boolean;
    visual: boolean;
    isolation: boolean;
    thermal: boolean;
  };
  dataSummary: {
    elAuditsCount: number;
    ivCurvesCount: number;
    visualInspectionsCount: number;
    isolationTestsCount: number;
    thermalReportsCount: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calcule conformité globale (moyenne pondérée modules disponibles)
 */
export function calculateOverallConformity(report: UnifiedReportData): number {
  let totalWeight = 0;
  let weightedSum = 0;
  
  // Module EL: poids 30%
  if (report.elModule.hasData) {
    totalWeight += 30;
    weightedSum += report.elModule.conformityRate * 30;
  }
  
  // Module Visuels: poids 30%
  if (report.visualModule.hasData) {
    totalWeight += 30;
    weightedSum += report.visualModule.checklist.conformityRate * 30;
  }
  
  // Module Isolation: poids 20%
  if (report.isolationModule.hasData) {
    totalWeight += 20;
    weightedSum += report.isolationModule.conformityRate * 20;
  }
  
  // Module IV: poids 20%
  if (report.ivModule.hasData) {
    const ivConformity = ((report.ivModule.totalCurves - report.ivModule.outOfToleranceCount) / report.ivModule.totalCurves) * 100;
    totalWeight += 20;
    weightedSum += ivConformity * 20;
  }
  
  if (totalWeight === 0) return 0;
  
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Génère token unique rapport
 */
export function generateReportToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `RPT_${timestamp}_${random}`;
}

/**
 * Détermine urgence actions (basé sur défauts critiques)
 */
export function requiresUrgentAction(report: UnifiedReportData): boolean {
  // Défauts critiques EL
  if (report.elModule.hasData && report.elModule.stats.dead > 0) return true;
  
  // Défauts critiques Visuels
  if (report.visualModule.hasData && report.visualModule.criticalDefectsCount > 0) return true;
  
  // Non-conformité isolation critique (<0.5 MΩ)
  if (report.isolationModule.hasData && report.isolationModule.latestTest) {
    const test = report.isolationModule.latestTest;
    const minValue = Math.min(
      test.dcPositiveToEarth || Infinity,
      test.dcNegativeToEarth || Infinity,
      test.dcPositiveToNegative || Infinity,
      test.acToEarth || Infinity
    );
    if (minValue < 0.5) return true;
  }
  
  return false;
}
