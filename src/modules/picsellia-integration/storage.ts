/**
 * Gestion stockage photos dans Cloudflare R2
 * Structure organisée par audit/string/module
 */

export interface PhotoMetadata {
  audit_token: string;
  module_id: string;
  string_number: number;
  file_name: string;
  uploaded_by?: string;
}

export interface R2UploadResult {
  success: boolean;
  r2_key: string;
  public_url: string;
  file_size: number;
  error?: string;
}

/**
 * Générer clé R2 structurée
 */
export function generateR2Key(metadata: PhotoMetadata, suffix: 'original' | 'annotated' | 'thumbnail' = 'original'): string {
  const { audit_token, string_number, module_id } = metadata;
  
  // Structure: audits/AUD-XXX/el/string-XX/MODULE_ID_suffix.jpg
  const sanitizedModuleId = module_id.replace(/[^a-zA-Z0-9-]/g, '_');
  const extension = suffix === 'thumbnail' ? 'thumb.jpg' : 'jpg';
  
  return `audits/${audit_token}/el/string-${String(string_number).padStart(2, '0')}/${sanitizedModuleId}_${suffix}.${extension}`;
}

/**
 * Upload photo vers R2
 */
export async function uploadPhotoToR2(
  r2: R2Bucket,
  photoData: ArrayBuffer | Uint8Array | ReadableStream,
  metadata: PhotoMetadata,
  suffix: 'original' | 'annotated' | 'thumbnail' = 'original'
): Promise<R2UploadResult> {
  try {
    const r2Key = generateR2Key(metadata, suffix);
    
    // Métadonnées custom pour R2
    const customMetadata: Record<string, string> = {
      audit_token: metadata.audit_token,
      module_id: metadata.module_id,
      string_number: String(metadata.string_number),
      uploaded_at: new Date().toISOString()
    };
    
    if (metadata.uploaded_by) {
      customMetadata.uploaded_by = metadata.uploaded_by;
    }

    // Upload vers R2
    await r2.put(r2Key, photoData, {
      httpMetadata: {
        contentType: 'image/jpeg'
      },
      customMetadata
    });

    // Générer URL publique (nécessite configuration public access R2)
    const publicUrl = `https://photos.diagpv.fr/${r2Key}`;
    
    // Taille approximative (si ArrayBuffer)
    const fileSize = photoData instanceof ArrayBuffer 
      ? photoData.byteLength 
      : photoData instanceof Uint8Array 
        ? photoData.byteLength 
        : 0;

    return {
      success: true,
      r2_key: r2Key,
      public_url: publicUrl,
      file_size: fileSize
    };
  } catch (error) {
    console.error('Erreur upload R2:', error);
    return {
      success: false,
      r2_key: '',
      public_url: '',
      file_size: 0,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Récupérer photo depuis R2
 */
export async function getPhotoFromR2(r2: R2Bucket, r2Key: string): Promise<R2ObjectBody | null> {
  try {
    const object = await r2.get(r2Key);
    return object;
  } catch (error) {
    console.error('Erreur récupération R2:', error);
    return null;
  }
}

/**
 * Supprimer photo de R2
 */
export async function deletePhotoFromR2(r2: R2Bucket, r2Key: string): Promise<boolean> {
  try {
    await r2.delete(r2Key);
    return true;
  } catch (error) {
    console.error('Erreur suppression R2:', error);
    return false;
  }
}

/**
 * Lister toutes les photos d'un audit
 */
export async function listAuditPhotos(r2: R2Bucket, auditToken: string): Promise<string[]> {
  try {
    const prefix = `audits/${auditToken}/el/`;
    const listed = await r2.list({ prefix });
    
    return listed.objects.map(obj => obj.key);
  } catch (error) {
    console.error('Erreur listing R2:', error);
    return [];
  }
}

/**
 * Convertir Base64 en ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Retirer header data:image/jpeg;base64, si présent
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Générer miniature (future implémentation avec image resize)
 */
export async function generateThumbnail(
  originalData: ArrayBuffer,
  maxWidth: number = 200
): Promise<ArrayBuffer> {
  // TODO: Implémenter resize image avec library
  // Pour l'instant retourne original
  return originalData;
}

/**
 * Extraire métadonnées EXIF (future implémentation)
 */
export function extractEXIFData(imageData: ArrayBuffer): Record<string, any> {
  // TODO: Implémenter extraction EXIF avec library
  return {
    extracted: false,
    message: 'EXIF extraction non encore implémentée'
  };
}
