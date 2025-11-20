import { Hono } from 'hono'
import type { D1Database, R2Bucket } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

const elPhotosRoutes = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// UPLOAD PHOTO EL
// ============================================================================
// POST /api/el/photos/upload
// Upload single photo to R2 and store metadata in D1
elPhotosRoutes.post('/upload', async (c) => {
  try {
    const { DB, R2 } = c.env
    const formData = await c.req.formData()
    
    const file = formData.get('photo') as File
    const auditToken = formData.get('audit_token') as string
    const moduleIdentifier = formData.get('module_identifier') as string
    const photoType = formData.get('photo_type') as string || 'defect'
    const defectCategory = formData.get('defect_category') as string || null
    const severityLevel = parseInt(formData.get('severity_level') as string || '0')
    const description = formData.get('description') as string || null
    const technicianNotes = formData.get('technician_notes') as string || null
    const gpsLatitude = formData.get('gps_latitude') ? parseFloat(formData.get('gps_latitude') as string) : null
    const gpsLongitude = formData.get('gps_longitude') ? parseFloat(formData.get('gps_longitude') as string) : null
    const stringNumber = formData.get('string_number') ? parseInt(formData.get('string_number') as string) : null
    const positionInString = formData.get('position_in_string') ? parseInt(formData.get('position_in_string') as string) : null
    const uploadedBy = formData.get('uploaded_by') ? parseInt(formData.get('uploaded_by') as string) : null
    
    if (!file || !auditToken || !moduleIdentifier) {
      return c.json({ error: 'Champs requis manquants: photo, audit_token, module_identifier' }, 400)
    }
    
    // Verify el_module exists
    const { results: modules } = await DB.prepare(`
      SELECT id FROM el_modules 
      WHERE audit_token = ? AND module_identifier = ?
      LIMIT 1
    `).bind(auditToken, moduleIdentifier).all()
    
    if (!modules || modules.length === 0) {
      return c.json({ error: 'Module EL introuvable' }, 404)
    }
    
    const elModuleId = (modules[0] as any).id
    
    // Generate R2 key: el_photos/{audit_token}/{module_identifier}/{timestamp}_{random}.{ext}
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 10)
    const ext = file.name.split('.').pop() || 'jpg'
    const r2Key = `el_photos/${auditToken}/${moduleIdentifier}/${timestamp}_${randomStr}.${ext}`
    
    // Upload to R2
    const arrayBuffer = await file.arrayBuffer()
    await R2.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'image/jpeg'
      }
    })
    
    // Generate public URL (format: https://{bucket}.{account}.r2.cloudflarestorage.com/{key})
    // Note: For production, you should use a custom domain or R2 public bucket URL
    const r2Url = `https://diagpv-el-photos.public.r2.dev/${r2Key}`
    
    // Insert metadata to D1
    const result = await DB.prepare(`
      INSERT INTO el_photos (
        el_module_id, audit_token, module_identifier,
        r2_key, r2_url,
        photo_type, defect_category, severity_level,
        description, technician_notes,
        capture_date, file_size, mime_type,
        gps_latitude, gps_longitude,
        string_number, position_in_string,
        uploaded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      elModuleId, auditToken, moduleIdentifier,
      r2Key, r2Url,
      photoType, defectCategory, severityLevel,
      description, technicianNotes,
      file.size, file.type,
      gpsLatitude, gpsLongitude,
      stringNumber, positionInString,
      uploadedBy
    ).run()
    
    return c.json({
      success: true,
      photo_id: result.meta.last_row_id,
      r2_key: r2Key,
      r2_url: r2Url,
      file_size: file.size,
      mime_type: file.type
    })
    
  } catch (error: any) {
    console.error('Upload error:', error)
    return c.json({ error: error.message || 'Erreur upload photo' }, 500)
  }
})

// ============================================================================
// LIST PHOTOS BY AUDIT
// ============================================================================
// GET /api/el/photos/:audit_token
elPhotosRoutes.get('/:audit_token', async (c) => {
  try {
    const { DB } = c.env
    const auditToken = c.req.param('audit_token')
    
    const { results } = await DB.prepare(`
      SELECT 
        p.*,
        m.string_number as module_string,
        m.position_in_string as module_position
      FROM el_photos p
      LEFT JOIN el_modules m ON p.el_module_id = m.id
      WHERE p.audit_token = ?
      ORDER BY p.created_at DESC
    `).bind(auditToken).all()
    
    return c.json({
      success: true,
      count: results?.length || 0,
      photos: results || []
    })
    
  } catch (error: any) {
    console.error('List photos error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ============================================================================
// LIST PHOTOS BY MODULE
// ============================================================================
// GET /api/el/photos/:audit_token/:module_identifier
elPhotosRoutes.get('/:audit_token/:module_identifier', async (c) => {
  try {
    const { DB } = c.env
    const auditToken = c.req.param('audit_token')
    const moduleIdentifier = c.req.param('module_identifier')
    
    const { results } = await DB.prepare(`
      SELECT * FROM el_photos
      WHERE audit_token = ? AND module_identifier = ?
      ORDER BY created_at DESC
    `).bind(auditToken, moduleIdentifier).all()
    
    return c.json({
      success: true,
      module_identifier: moduleIdentifier,
      count: results?.length || 0,
      photos: results || []
    })
    
  } catch (error: any) {
    console.error('List module photos error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ============================================================================
// GET PHOTO DETAILS
// ============================================================================
// GET /api/el/photos/detail/:photo_id
elPhotosRoutes.get('/detail/:photo_id', async (c) => {
  try {
    const { DB } = c.env
    const photoId = c.req.param('photo_id')
    
    const { results } = await DB.prepare(`
      SELECT 
        p.*,
        m.string_number as module_string,
        m.position_in_string as module_position,
        m.defect_type as module_defect_type
      FROM el_photos p
      LEFT JOIN el_modules m ON p.el_module_id = m.id
      WHERE p.id = ?
    `).bind(photoId).all()
    
    if (!results || results.length === 0) {
      return c.json({ error: 'Photo introuvable' }, 404)
    }
    
    return c.json({
      success: true,
      photo: results[0]
    })
    
  } catch (error: any) {
    console.error('Get photo detail error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ============================================================================
// DELETE PHOTO
// ============================================================================
// DELETE /api/el/photos/:photo_id
elPhotosRoutes.delete('/:photo_id', async (c) => {
  try {
    const { DB, R2 } = c.env
    const photoId = c.req.param('photo_id')
    
    // Get photo metadata
    const { results } = await DB.prepare(`
      SELECT r2_key FROM el_photos WHERE id = ?
    `).bind(photoId).all()
    
    if (!results || results.length === 0) {
      return c.json({ error: 'Photo introuvable' }, 404)
    }
    
    const r2Key = (results[0] as any).r2_key
    
    // Delete from R2
    await R2.delete(r2Key)
    
    // Delete from D1
    await DB.prepare(`DELETE FROM el_photos WHERE id = ?`).bind(photoId).run()
    
    return c.json({
      success: true,
      message: 'Photo supprimée avec succès'
    })
    
  } catch (error: any) {
    console.error('Delete photo error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ============================================================================
// UPDATE PHOTO METADATA
// ============================================================================
// PATCH /api/el/photos/:photo_id
elPhotosRoutes.patch('/:photo_id', async (c) => {
  try {
    const { DB } = c.env
    const photoId = c.req.param('photo_id')
    const body = await c.req.json()
    
    const {
      photo_type,
      defect_category,
      severity_level,
      description,
      technician_notes
    } = body
    
    const updates: string[] = []
    const values: any[] = []
    
    if (photo_type !== undefined) {
      updates.push('photo_type = ?')
      values.push(photo_type)
    }
    if (defect_category !== undefined) {
      updates.push('defect_category = ?')
      values.push(defect_category)
    }
    if (severity_level !== undefined) {
      updates.push('severity_level = ?')
      values.push(severity_level)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (technician_notes !== undefined) {
      updates.push('technician_notes = ?')
      values.push(technician_notes)
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'Aucune donnée à mettre à jour' }, 400)
    }
    
    values.push(photoId)
    
    await DB.prepare(`
      UPDATE el_photos 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run()
    
    return c.json({
      success: true,
      message: 'Photo mise à jour'
    })
    
  } catch (error: any) {
    console.error('Update photo error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ============================================================================
// STATISTICS BY AUDIT
// ============================================================================
// GET /api/el/photos/stats/:audit_token
elPhotosRoutes.get('/stats/:audit_token', async (c) => {
  try {
    const { DB } = c.env
    const auditToken = c.req.param('audit_token')
    
    const { results } = await DB.prepare(`
      SELECT * FROM v_el_photos_stats WHERE audit_token = ?
    `).bind(auditToken).all()
    
    if (!results || results.length === 0) {
      return c.json({
        success: true,
        stats: {
          total_photos: 0,
          modules_with_photos: 0,
          defect_photos: 0,
          critical_photos: 0,
          total_storage_bytes: 0
        }
      })
    }
    
    return c.json({
      success: true,
      stats: results[0]
    })
    
  } catch (error: any) {
    console.error('Stats error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ============================================================================
// BATCH UPLOAD MULTIPLE PHOTOS
// ============================================================================
// POST /api/el/photos/batch-upload
elPhotosRoutes.post('/batch-upload', async (c) => {
  try {
    const { DB, R2 } = c.env
    const formData = await c.req.formData()
    
    const auditToken = formData.get('audit_token') as string
    if (!auditToken) {
      return c.json({ error: 'audit_token requis' }, 400)
    }
    
    const results: any[] = []
    const errors: any[] = []
    
    // Process each file
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('photo_') && value instanceof File) {
        try {
          const file = value as File
          const index = key.split('_')[1]
          const moduleIdentifier = formData.get(`module_identifier_${index}`) as string
          const photoType = formData.get(`photo_type_${index}`) as string || 'defect'
          const defectCategory = formData.get(`defect_category_${index}`) as string || null
          const severityLevel = parseInt(formData.get(`severity_level_${index}`) as string || '0')
          
          if (!moduleIdentifier) {
            errors.push({ file: file.name, error: 'module_identifier manquant' })
            continue
          }
          
          // Verify module exists
          const { results: modules } = await DB.prepare(`
            SELECT id FROM el_modules 
            WHERE audit_token = ? AND module_identifier = ?
            LIMIT 1
          `).bind(auditToken, moduleIdentifier).all()
          
          if (!modules || modules.length === 0) {
            errors.push({ file: file.name, error: 'Module introuvable', module_identifier: moduleIdentifier })
            continue
          }
          
          const elModuleId = (modules[0] as any).id
          
          // Generate R2 key
          const timestamp = Date.now()
          const randomStr = Math.random().toString(36).substring(2, 10)
          const ext = file.name.split('.').pop() || 'jpg'
          const r2Key = `el_photos/${auditToken}/${moduleIdentifier}/${timestamp}_${randomStr}.${ext}`
          
          // Upload to R2
          const arrayBuffer = await file.arrayBuffer()
          await R2.put(r2Key, arrayBuffer, {
            httpMetadata: {
              contentType: file.type || 'image/jpeg'
            }
          })
          
          const r2Url = `https://diagpv-el-photos.public.r2.dev/${r2Key}`
          
          // Insert to D1
          const result = await DB.prepare(`
            INSERT INTO el_photos (
              el_module_id, audit_token, module_identifier,
              r2_key, r2_url,
              photo_type, defect_category, severity_level,
              capture_date, file_size, mime_type,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, datetime('now'))
          `).bind(
            elModuleId, auditToken, moduleIdentifier,
            r2Key, r2Url,
            photoType, defectCategory, severityLevel,
            file.size, file.type
          ).run()
          
          results.push({
            file: file.name,
            photo_id: result.meta.last_row_id,
            module_identifier: moduleIdentifier,
            r2_url: r2Url
          })
          
        } catch (error: any) {
          errors.push({ file: (value as File).name, error: error.message })
        }
      }
    }
    
    return c.json({
      success: true,
      uploaded: results.length,
      failed: errors.length,
      results,
      errors
    })
    
  } catch (error: any) {
    console.error('Batch upload error:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default elPhotosRoutes
