/**
 * Types pour intégration Picsellia AI
 * Analyse automatique photos électroluminescence
 */

// ============================================================================
// TYPES DÉFAUTS DÉTECTÉS PAR IA
// ============================================================================

export type DefectType = 
  | 'PID'                  // Potential Induced Degradation
  | 'LID'                  // Light Induced Degradation
  | 'microcracks'          // Microfissures
  | 'hotspot'              // Point chaud
  | 'diode_failure'        // Diode bypass défaillante
  | 'cell_damage'          // Dommage cellule
  | 'string_open'          // String ouvert
  | 'solder_bond'          // Défaut soudure
  | 'corrosion'            // Corrosion
  | 'delamination'         // Délamination
  | 'snail_trail'          // Traînée d'escargot
  | 'burn_mark';           // Marque de brûlure

export type DefectSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BoundingBox {
  x: number;         // Position X (pixels ou %)
  y: number;         // Position Y (pixels ou %)
  width: number;     // Largeur
  height: number;    // Hauteur
}

export interface PicselliaDefect {
  type: DefectType;
  confidence: number;           // 0.0 à 1.0
  severity: DefectSeverity;
  bbox: BoundingBox;           // Zone détection
  description?: string;        // Description défaut
  affected_cells?: number[];   // IDs cellules affectées
}

// ============================================================================
// RÉSULTAT ANALYSE PICSELLIA
// ============================================================================

export interface PicselliaAnalysisResult {
  image_id: string;                    // ID unique image
  module_id: string;                   // Ex: "M001"
  status: 'success' | 'error';
  confidence_score: number;            // Score confiance global 0.0-1.0
  defects: PicselliaDefect[];          // Liste défauts détectés
  processing_time_ms: number;          // Temps traitement
  annotated_image_url?: string;        // URL image annotée
  error_message?: string;              // Message erreur si échec
  metadata?: {
    model_version: string;
    analyzed_at: string;
    image_quality_score?: number;
  };
}

// ============================================================================
// REQUÊTES API PICSELLIA
// ============================================================================

export interface PicselliaAnalyzeRequest {
  image_url: string;                   // URL publique image
  module_id: string;
  audit_token?: string;
  options?: {
    return_annotated?: boolean;        // Retourner image annotée
    min_confidence?: number;           // Seuil confiance minimum
    detect_types?: DefectType[];       // Types défauts à détecter
  };
}

export interface PicselliaBatchAnalyzeRequest {
  images: Array<{
    image_url: string;
    module_id: string;
  }>;
  audit_token: string;
  options?: {
    return_annotated?: boolean;
    min_confidence?: number;
  };
}

// ============================================================================
// PHOTO EL (Base de données)
// ============================================================================

export interface ELPhoto {
  id: number;
  audit_token: string;
  module_id: string;
  string_number: number;
  
  // URLs
  photo_url: string;
  photo_annotated_url?: string;
  photo_thumbnail_url?: string;
  uploaded_at: string;
  uploaded_by?: string;
  
  // Analyse IA
  ai_analyzed: boolean;
  ai_analyzed_at?: string;
  ai_confidence?: number;
  ai_defects_detected?: string;        // JSON PicselliaDefect[]
  ai_status: 'pending' | 'analyzing' | 'completed' | 'failed';
  ai_error?: string;
  ai_processing_time_ms?: number;
  
  // Validation humaine
  human_validated: boolean;
  validated_by?: string;
  validated_at?: string;
  validation_notes?: string;
  validation_action?: 'accepted' | 'corrected' | 'rejected';
  
  // Métadonnées
  file_name: string;
  file_size?: number;
  file_type?: string;
  image_width?: number;
  image_height?: number;
  exif_data?: string;                  // JSON
  
  audit_date?: string;
  location?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// UPLOAD PHOTOS
// ============================================================================

export interface PhotoUploadRequest {
  audit_token: string;
  photos: Array<{
    module_id: string;
    string_number: number;
    file_name: string;
    file_data: string;                 // Base64 ou Blob URL
    file_size: number;
    file_type: string;
  }>;
  uploaded_by?: string;
}

export interface PhotoUploadResponse {
  success: boolean;
  uploaded: number;
  failed: number;
  photos: Array<{
    module_id: string;
    status: 'uploaded' | 'failed';
    photo_url?: string;
    error?: string;
  }>;
}

// ============================================================================
// VALIDATION HUMAINE
// ============================================================================

export interface ValidationReviewItem {
  photo_id: number;
  module_id: string;
  photo_url: string;
  photo_annotated_url?: string;
  
  // Saisie manuelle (si existante)
  manual_defect?: string;
  manual_remarks?: string;
  
  // Détection IA
  ai_confidence: number;
  ai_defects: PicselliaDefect[];
  ai_status: string;
  
  // Comparaison
  match_status: 'identical' | 'partial' | 'different' | 'ai_only' | 'manual_only';
}

export interface ValidationAction {
  photo_id: number;
  action: 'accepted' | 'corrected' | 'rejected';
  validated_by: string;
  notes?: string;
  corrected_defects?: PicselliaDefect[];  // Si correction manuelle
}

// ============================================================================
// STATISTIQUES ANALYSE
// ============================================================================

export interface AnalysisStatistics {
  audit_token: string;
  total_photos: number;
  analyzed_photos: number;
  pending_analysis: number;
  failed_analysis: number;
  
  avg_confidence: number;
  total_defects_detected: number;
  defects_by_type: Record<DefectType, number>;
  
  validation_stats: {
    total_validated: number;
    accepted: number;
    corrected: number;
    rejected: number;
    agreement_rate: number;            // % accord IA/humain
  };
}
