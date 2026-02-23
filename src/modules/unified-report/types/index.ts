/**
 * Types TypeScript - Module Rapport Unifié
 * Agrégation multi-modules: EL + IV + Visuels + Isolation + Thermique + Audit Qualité + Diodes
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
// MODULE PHOTOS - GALERIE & PREUVES
// ============================================================================

export interface PhotosModuleData {
  hasData: boolean;
  totalPhotos: number;
  photos: Array<{
    url: string;
    description: string;
    tag: string;
  }>;
}

// ============================================================================
// MODULE AUDIT QUALITÉ TERRAIN (NF C 15-100 / DTU 40.35)
// ============================================================================

export interface AuditQualiteModuleData {
  hasData: boolean;
  missionId: number | null;
  reference: string;
  typeAudit: string; // 'SOL', 'TOITURE', 'DOUBLE'
  missionDate: string;
  technicianName: string | null;
  // Stats SOL
  solChecklist: {
    totalItems: number;
    conformes: number;
    nonConformes: number;
    observations: number;
    conformityRate: number;
  };
  // Stats TOITURE
  toitureChecklist: {
    totalItems: number;
    conformes: number;
    nonConformes: number;
    observations: number;
    conformityRate: number;
  };
  // Global
  scoreGlobal: number;
  nbNonConformites: number;
  nbObservations: number;
  // Détails non-conformités critiques
  criticalItems: Array<{
    code: string;
    libelle: string;
    categorie: string;
    severite: string;
    norme: string;
    type: 'sol' | 'toiture';
  }>;
  // Commentaires finaux
  conclusion: string | null;
  recommendations: string | null;
}

// ============================================================================
// MODULE TEST DIODES BYPASS
// ============================================================================

export interface DiodeTestModuleData {
  hasData: boolean;
  sessionToken: string;
  method: string; // 'thermal', 'iv_curve', 'combined'
  testDate: string;
  technicianName: string | null;
  totalDiodesTested: number;
  diodesOk: number;
  diodesDefective: number;
  diodesSuspect: number;
  conformityRate: number;
  // Défauts critiques
  criticalDefects: Array<{
    moduleIdentifier: string;
    diodePosition: string;
    defectType: string;
    severity: string;
    temperatureDiode: number | null;
    deltaT: number | null;
    observation: string | null;
  }>;
  maxTemperature: number | null;
  maxDeltaT: number | null;
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
  auditQualiteModule: AuditQualiteModuleData;
  diodeTestModule: DiodeTestModuleData;
  modules: { // Structure flexible pour extension
      photos?: { enabled: boolean; count: number; data: PhotosModuleData };
  };
  
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

  // Notes de terrain (Vocales / Textuelles)
  fieldNotes?: Array<{
    id: number;
    content: string;
    technicianId: string | null;
    createdAt: string;
  }>;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GenerateUnifiedReportRequest {
  plantId?: number;
  auditElToken?: string; // Si rapport basé sur audit EL spécifique
  inspectionToken?: string; // Si rapport basé sur inspection visuelle
  missionQualiteId?: number; // Si rapport basé sur mission audit qualité
  diodeSessionToken?: string; // Si rapport basé sur session test diodes
  includeModules?: ('el' | 'iv' | 'visual' | 'isolation' | 'thermal' | 'photos' | 'audit_qualite' | 'diodes')[];
  generatedBy?: string;
  additionalNotes?: string;
  // Extra fields used by route handler
  reportTitle?: string;
  auditDate?: string;
  auditorName?: string;
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
    audit_qualite: boolean;
    diodes: boolean;
  };
  dataSummary: {
    elAuditsCount: number;
    ivCurvesCount: number;
    visualInspectionsCount: number;
    isolationTestsCount: number;
    thermalReportsCount: number;
    auditQualiteCount: number;
    diodeSessionsCount: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calcule conformité globale (moyenne pondérée modules disponibles)
 * Pondérations: EL=25, Visual=20, Isolation=15, IV=15, AuditQualité=15, Diodes=10
 */
export function calculateOverallConformity(report: UnifiedReportData): number {
  let totalWeight = 0;
  let weightedSum = 0;
  
  // Module EL: poids 25
  if (report.elModule.hasData) {
    totalWeight += 25;
    weightedSum += report.elModule.conformityRate * 25;
  }
  
  // Module Visuels: poids 20
  if (report.visualModule.hasData) {
    totalWeight += 20;
    weightedSum += report.visualModule.checklist.conformityRate * 20;
  }
  
  // Module Isolation: poids 15
  if (report.isolationModule.hasData) {
    totalWeight += 15;
    weightedSum += report.isolationModule.conformityRate * 15;
  }
  
  // Module IV: poids 15
  if (report.ivModule.hasData) {
    const ivConformity = ((report.ivModule.totalCurves - report.ivModule.outOfToleranceCount) / report.ivModule.totalCurves) * 100;
    totalWeight += 15;
    weightedSum += ivConformity * 15;
  }
  
  // Module Audit Qualité: poids 15
  if (report.auditQualiteModule.hasData) {
    totalWeight += 15;
    weightedSum += report.auditQualiteModule.scoreGlobal * 15;
  }
  
  // Module Test Diodes: poids 10
  if (report.diodeTestModule.hasData) {
    totalWeight += 10;
    weightedSum += report.diodeTestModule.conformityRate * 10;
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
  
  // Audit Qualité critiques
  if (report.auditQualiteModule.hasData && report.auditQualiteModule.criticalItems.length > 0) return true;
  
  // Diodes défectueuses critiques
  if (report.diodeTestModule.hasData && report.diodeTestModule.criticalDefects.length > 0) return true;
  
  return false;
}
