
import { Context } from 'hono'

// Interface pour les métadonnées standardisées
export interface StandardizedPhotoMetadata {
  r2_key: string
  public_url: string
  file_name: string
  mime_type: string
  file_size: number
  uploaded_at: string
  
  // Métadonnées métier
  audit_token: string
  photo_type: string
  module_id?: string
  string_number?: number
  module_number?: number
  
  // Métadonnées AI-Ready
  ai_status: 'pending' | 'processed' | 'failed' | 'skipped'
  ai_metadata?: string // JSON stringified
}

export class PhotoStandardizationService {
  
  /**
   * Génère une clé R2 standardisée pour le stockage
   * Format: photos/{audit_token}/{photo_type}/{YYYY-MM-DD}/{filename}
   */
  static generateStandardizedKey(
    auditToken: string,
    photoType: string,
    extension: string,
    stringNumber?: number | string | null,
    moduleNumber?: number | string | null
  ): string {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const timestamp = now.getTime()
    const random = Math.random().toString(36).substring(2, 8)
    
    // Normalisation du type de photo
    const normalizedType = photoType.toLowerCase()
    
    // Construction du nom de fichier
    let fileName = ''
    if (stringNumber !== null && stringNumber !== undefined && moduleNumber !== null && moduleNumber !== undefined) {
      // S01_M12_167888888_abc12.jpg
      const s = stringNumber.toString().padStart(2, '0')
      const m = moduleNumber.toString().padStart(2, '0')
      fileName = `S${s}_M${m}_${timestamp}_${random}.${extension}`
    } else {
      // GLOBAL_167888888_abc12.jpg
      fileName = `GLOBAL_${timestamp}_${random}.${extension}`
    }
    
    // Clé complète
    // Ex: photos/TOKEN123/el/2025-12-08/S01_M12_123456789_abc.jpg
    return `photos/${auditToken}/${normalizedType}/${dateStr}/${fileName}`
  }

  /**
   * Prépare l'objet de métadonnées pour R2 customMetadata
   * (R2 n'accepte que des strings dans customMetadata)
   */
  static getR2Metadata(
    auditToken: string,
    photoType: string,
    moduleId?: string | null,
    stringNumber?: number | string | null,
    moduleNumber?: number | string | null,
    gpsLat?: number | string | null,
    gpsLon?: number | string | null
  ): Record<string, string> {
    const metadata: Record<string, string> = {
      audit_token: auditToken,
      photo_type: photoType,
      uploaded_at: new Date().toISOString(),
      standardized_version: 'v1'
    }

    if (moduleId) metadata.module_id = moduleId
    if (stringNumber) metadata.string_number = stringNumber.toString()
    if (moduleNumber) metadata.module_number = moduleNumber.toString()
    if (gpsLat) metadata.gps_latitude = gpsLat.toString()
    if (gpsLon) metadata.gps_longitude = gpsLon.toString()

    return metadata
  }
}
