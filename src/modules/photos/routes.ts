// ============================================================================
// MODULE PHOTOS - UPLOAD & STOCKAGE R2
// ============================================================================
// Upload photos EL, thermographie, visuelles vers Cloudflare R2
// Génération URLs publiques pour intégration rapports
// ============================================================================

import { Hono } from 'hono'
import { PhotoStandardizationService } from '../../services/PhotoStandardizationService'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const photos = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// POST /api/photos/upload - Upload photo vers R2
// Body multipart/form-data:
//   - file: Photo (JPEG/PNG)
//   - audit_token: Token audit
//   - photo_type: 'el' | 'thermal' | 'visual' | 'iv'
//   - module_id?: ID module (optionnel)
//   - string_number?: Numéro string (optionnel)
//   - module_number?: Numéro module (optionnel)
// ============================================================================
photos.post('/upload', async (c) => {
  try {
    let file: any
    let auditToken: string
    let photoType: string
    let moduleId: string | null = null
    let stringNumber: string | null = null
    let moduleNumber: string | null = null

    const contentType = c.req.header('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await c.req.json()
      auditToken = body.audit_token
      photoType = body.module_type || body.photo_type
      moduleId = body.module_id
      stringNumber = body.string_number ? String(body.string_number) : null
      moduleNumber = body.module_number ? String(body.module_number) : null

      if (body.photo_data) {
        const matches = body.photo_data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
        if (matches) {
          const type = matches[1]
          const binStr = atob(matches[2])
          const len = binStr.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) {
            bytes[i] = binStr.charCodeAt(i)
          }
          const buffer = bytes.buffer
          
          file = {
            name: `upload.${type.split('/')[1]}`,
            type: type,
            size: buffer.byteLength,
            arrayBuffer: async () => buffer
          }
        }
      }
    } else {
      const formData = await c.req.formData()
      file = formData.get('file') as File
      auditToken = formData.get('audit_token') as string
      photoType = formData.get('photo_type') as string
      moduleId = formData.get('module_id') as string | null
      stringNumber = formData.get('string_number') as string | null
      moduleNumber = formData.get('module_number') as string | null
    }

    if (!file) {
      return c.json({ success: false, error: 'Fichier requis' }, 400)
    }

    if (!auditToken) {
      return c.json({ success: false, error: 'audit_token requis' }, 400)
    }

    if (!['el', 'thermal', 'visual', 'iv'].includes(photoType)) {
      return c.json({ success: false, error: 'photo_type invalide' }, 400)
    }

    // Vérifier type MIME
    if (!file.type.startsWith('image/')) {
      return c.json({ success: false, error: 'Le fichier doit être une image' }, 400)
    }

    // Générer nom standardisé via Service
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = PhotoStandardizationService.generateStandardizedKey(
      auditToken,
      photoType,
      extension,
      stringNumber,
      moduleNumber
    )

    // Préparer métadonnées R2 via Service
    const r2Metadata = PhotoStandardizationService.getR2Metadata(
      auditToken,
      photoType,
      moduleId,
      stringNumber,
      moduleNumber
    )

    // Upload vers R2
    const buffer = await file.arrayBuffer()
    await c.env.R2.put(fileName, buffer, {
      httpMetadata: {
        contentType: file.type
      },
      customMetadata: r2Metadata
    })

    // Générer URL publique
    const publicUrl = `/api/photos/view/${fileName}`

    // Enregistrer métadonnées dans D1
    await c.env.DB.prepare(`
      INSERT INTO photos (
        audit_token, module_type, photo_data, photo_format, photo_size,
        string_number, module_number, r2_key, public_url, mime_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      auditToken,
      photoType.toUpperCase(),
      '', // photo_data vide (utilise R2)
      file.type,
      file.size,
      stringNumber ? parseInt(stringNumber) : null,
      moduleNumber ? parseInt(moduleNumber) : null,
      fileName,
      publicUrl,
      file.type
    ).run()

    return c.json({
      success: true,
      message: 'Photo uploadée avec succès',
      data: {
        r2_key: fileName,
        public_url: publicUrl,
        file_size: file.size,
        mime_type: file.type
      }
    })

  } catch (error: any) {
    console.error('Erreur upload photo:', error)
    return c.json({
      success: false,
      error: 'Erreur upload photo',
      details: error.message
    }, 500)
  }
})

// ============================================================================
// GET /api/photos/view/:key - Récupérer photo depuis R2
// Sert l'image directement depuis R2 avec headers appropriés
// ============================================================================
photos.get('/view/*', async (c) => {
  try {
    // Extraire key depuis URL
    const key = c.req.param('*')

    if (!key) {
      return c.json({ error: 'Clé R2 requise' }, 400)
    }

    // Récupérer depuis R2
    const object = await c.env.R2.get(key)

    if (!object) {
      return c.json({ error: 'Photo non trouvée' }, 404)
    }

    // Retourner image avec headers
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'ETag': object.httpEtag
      }
    })

  } catch (error: any) {
    console.error('Erreur récupération photo:', error)
    return c.json({
      success: false,
      error: 'Erreur récupération photo',
      details: error.message
    }, 500)
  }
})

// ============================================================================
// GET /api/photos/list/:audit_token - Lister photos d'un audit
// Query params:
//   - photo_type?: Filtrer par type ('el', 'thermal', 'visual', 'iv')
//   - string_number?: Filtrer par string
//   - module_number?: Filtrer par module
// ============================================================================
photos.get('/list/:audit_token', async (c) => {
  try {
    const auditToken = c.req.param('audit_token')
    const photoType = c.req.query('photo_type')
    const stringNumber = c.req.query('string_number')
    const moduleNumber = c.req.query('module_number')

    let query = `
      SELECT 
        id, audit_token, module_type as photo_type, string_number, module_number,
        r2_key, public_url, photo_size as file_size, mime_type, created_at as uploaded_at
      FROM photos
      WHERE audit_token = ?
    `
    const params: any[] = [auditToken]

    if (photoType) {
      query += ` AND module_type = ?`
      params.push(photoType.toUpperCase())
    }

    if (stringNumber) {
      query += ` AND string_number = ?`
      params.push(parseInt(stringNumber))
    }

    if (moduleNumber) {
      query += ` AND module_number = ?`
      params.push(parseInt(moduleNumber))
    }

    query += ` ORDER BY uploaded_at DESC`

    const result = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({
      success: true,
      data: result.results,
      count: result.results?.length || 0
    })

  } catch (error: any) {
    console.error('Erreur liste photos:', error)
    return c.json({
      success: false,
      error: 'Erreur liste photos',
      details: error.message
    }, 500)
  }
})

// ============================================================================
// DELETE /api/photos/:id - Supprimer photo
// Supprime de R2 ET de D1
// ============================================================================
photos.delete('/:id', async (c) => {
  try {
    const photoId = parseInt(c.req.param('id'))

    // Récupérer info photo
    const photo = await c.env.DB.prepare(`
      SELECT r2_key FROM photos WHERE id = ?
    `).bind(photoId).first()

    if (!photo) {
      return c.json({ success: false, error: 'Photo non trouvée' }, 404)
    }

    // Supprimer de R2
    await c.env.R2.delete(photo.r2_key as string)

    // Supprimer de D1
    await c.env.DB.prepare(`
      DELETE FROM photos WHERE id = ?
    `).bind(photoId).run()

    return c.json({
      success: true,
      message: 'Photo supprimée avec succès'
    })

  } catch (error: any) {
    console.error('Erreur suppression photo:', error)
    return c.json({
      success: false,
      error: 'Erreur suppression photo',
      details: error.message
    }, 500)
  }
})

// ============================================================================
// POST /api/photos/bulk-upload - Upload multiple photos
// Body multipart/form-data:
//   - files[]: Array de fichiers
//   - audit_token: Token audit
//   - photo_type: Type photos
// ============================================================================
photos.post('/bulk-upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const auditToken = formData.get('audit_token') as string
    const photoType = formData.get('photo_type') as string

    if (!auditToken || !photoType) {
      return c.json({ success: false, error: 'audit_token et photo_type requis' }, 400)
    }

    const files = formData.getAll('files[]') as File[]

    if (files.length === 0) {
      return c.json({ success: false, error: 'Aucun fichier fourni' }, 400)
    }

    const results = []
    const errors = []

    for (const file of files) {
      try {
        if (!file.type.startsWith('image/')) {
          errors.push({ file: file.name, error: 'Type fichier invalide' })
          continue
        }

        const extension = file.name.split('.').pop() || 'jpg'
        const fileName = PhotoStandardizationService.generateStandardizedKey(
          auditToken,
          photoType,
          extension
        )

        const r2Metadata = PhotoStandardizationService.getR2Metadata(
          auditToken,
          photoType
        )

        const buffer = await file.arrayBuffer()
        await c.env.R2.put(fileName, buffer, {
          httpMetadata: { contentType: file.type },
          customMetadata: r2Metadata
        })

        const publicUrl = `/api/photos/view/${fileName}`

        await c.env.DB.prepare(`
          INSERT INTO photos (
            audit_token, module_type, photo_data, photo_format, photo_size,
            r2_key, public_url, mime_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(auditToken, photoType.toUpperCase(), '', file.type, file.size, fileName, publicUrl, file.type).run()

        results.push({
          file: file.name,
          r2_key: fileName,
          public_url: publicUrl,
          success: true
        })

      } catch (error: any) {
        errors.push({ file: file.name, error: error.message })
      }
    }

    return c.json({
      success: errors.length === 0,
      message: `${results.length} photos uploadées, ${errors.length} erreurs`,
      data: { results, errors }
    })

  } catch (error: any) {
    console.error('Erreur bulk upload:', error)
    return c.json({
      success: false,
      error: 'Erreur bulk upload',
      details: error.message
    }, 500)
  }
})

export default photos
