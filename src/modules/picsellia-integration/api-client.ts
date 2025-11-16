/**
 * Client API Picsellia
 * Actuellement en mode MOCK (en attente clés API)
 * Sera remplacé par vraie intégration quand NDA signé + API disponible
 */

import type {
  PicselliaAnalyzeRequest,
  PicselliaBatchAnalyzeRequest,
  PicselliaAnalysisResult,
  DefectType
} from './types.js';

export class PicselliaAPIClient {
  private apiKey: string;
  private baseURL: string;
  private mockMode: boolean;

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey || 'MOCK_API_KEY';
    this.baseURL = baseURL || 'https://api.picsellia.com/v1';
    this.mockMode = !apiKey || apiKey === 'MOCK_API_KEY';
    
    if (this.mockMode) {
      console.log('⚠️ Picsellia API Client en mode MOCK - En attente clés API réelles');
    }
  }

  /**
   * Analyse une seule image
   */
  async analyzeImage(request: PicselliaAnalyzeRequest): Promise<PicselliaAnalysisResult> {
    if (this.mockMode) {
      return this.mockAnalyzeImage(request);
    }

    try {
      const response = await fetch(`${this.baseURL}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_url: request.image_url,
          module_id: request.module_id,
          audit_token: request.audit_token,
          return_annotated: request.options?.return_annotated ?? true,
          min_confidence: request.options?.min_confidence ?? 0.5,
          detect_types: request.options?.detect_types
        })
      });

      if (!response.ok) {
        throw new Error(`Picsellia API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur analyse Picsellia:', error);
      return {
        image_id: request.module_id,
        module_id: request.module_id,
        status: 'error',
        confidence_score: 0,
        defects: [],
        processing_time_ms: 0,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analyse batch (plusieurs images)
   */
  async batchAnalyze(request: PicselliaBatchAnalyzeRequest): Promise<PicselliaAnalysisResult[]> {
    if (this.mockMode) {
      return this.mockBatchAnalyze(request);
    }

    try {
      const response = await fetch(`${this.baseURL}/batch-analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images: request.images,
          audit_token: request.audit_token,
          return_annotated: request.options?.return_annotated ?? true,
          min_confidence: request.options?.min_confidence ?? 0.5
        })
      });

      if (!response.ok) {
        throw new Error(`Picsellia API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Erreur batch analyze Picsellia:', error);
      
      // Retourner erreurs pour chaque image
      return request.images.map(img => ({
        image_id: img.module_id,
        module_id: img.module_id,
        status: 'error' as const,
        confidence_score: 0,
        defects: [],
        processing_time_ms: 0,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  /**
   * Check health API Picsellia
   */
  async checkHealth(): Promise<{ status: string; version?: string }> {
    if (this.mockMode) {
      return { status: 'mock', version: 'mock-1.0.0' };
    }

    try {
      const response = await fetch(`${this.baseURL}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return { status: 'error' };
    }
  }

  // ============================================================================
  // MODE MOCK (En attente API réelle Picsellia)
  // ============================================================================

  /**
   * Analyse MOCK pour démo/développement
   */
  private mockAnalyzeImage(request: PicselliaAnalyzeRequest): PicselliaAnalysisResult {
    // Simulation temps traitement
    const processingTime = Math.random() * 2000 + 1000; // 1-3 secondes

    // Simulation détection défauts aléatoires
    const defects: any[] = [];
    const defectTypes: DefectType[] = ['microcracks', 'PID', 'hotspot', 'cell_damage'];
    const numDefects = Math.floor(Math.random() * 3); // 0-2 défauts

    for (let i = 0; i < numDefects; i++) {
      defects.push({
        type: defectTypes[Math.floor(Math.random() * defectTypes.length)],
        confidence: 0.7 + Math.random() * 0.3, // 0.7-1.0
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        bbox: {
          x: Math.random() * 0.8,
          y: Math.random() * 0.8,
          width: 0.1 + Math.random() * 0.2,
          height: 0.1 + Math.random() * 0.2
        },
        description: 'Défaut détecté par IA (MOCK)'
      });
    }

    const confidenceScore = defects.length > 0
      ? defects.reduce((sum, d) => sum + d.confidence, 0) / defects.length
      : 0.95;

    return {
      image_id: request.module_id,
      module_id: request.module_id,
      status: 'success',
      confidence_score: Math.round(confidenceScore * 100) / 100,
      defects,
      processing_time_ms: Math.round(processingTime),
      annotated_image_url: request.options?.return_annotated 
        ? `${request.image_url}?annotated=true` 
        : undefined,
      metadata: {
        model_version: 'mock-v1.0.0',
        analyzed_at: new Date().toISOString(),
        image_quality_score: 0.85 + Math.random() * 0.15
      }
    };
  }

  /**
   * Batch analyze MOCK
   */
  private mockBatchAnalyze(request: PicselliaBatchAnalyzeRequest): PicselliaAnalysisResult[] {
    return request.images.map(img => 
      this.mockAnalyzeImage({
        image_url: img.image_url,
        module_id: img.module_id,
        audit_token: request.audit_token,
        options: request.options
      })
    );
  }
}

/**
 * Factory pour créer client API
 */
export function createPicselliaClient(apiKey?: string, baseURL?: string): PicselliaAPIClient {
  return new PicselliaAPIClient(apiKey, baseURL);
}
