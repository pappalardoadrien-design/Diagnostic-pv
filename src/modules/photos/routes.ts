import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// UPLOAD PHOTO - Base64 avec compression
// ============================================================================
app.post('/upload', async (c) => {
  try {
    const { DB } = c.env
    const body = await c.req.json()
    
    const {
      audit_token,
      module_type, // EL, IV, VISUAL, ISOLATION
      photo_data, // base64 string
      description,
      string_number,
      module_number,
      latitude,
      longitude,
      accuracy
    } = body

    if (!audit_token || !photo_data) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    // Valider que c'est bien du base64
    if (!photo_data.startsWith('data:image/')) {
      return c.json({ error: 'Invalid image format' }, 400)
    }

    // Extraire les métadonnées de l'image
    const matches = photo_data.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      return c.json({ error: 'Invalid base64 format' }, 400)
    }

    const imageFormat = matches[1] // jpeg, png, etc
    const base64Data = matches[2]
    const imageSize = Math.round((base64Data.length * 3) / 4) // Taille approximative en bytes

    // Insérer dans la base de données
    const result = await DB.prepare(`
      INSERT INTO photos (
        audit_token,
        module_type,
        photo_data,
        photo_format,
        photo_size,
        description,
        string_number,
        module_number,
        latitude,
        longitude,
        gps_accuracy,
        captured_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      audit_token,
      module_type || 'GENERAL',
      photo_data, // Stockage base64 dans D1 (limité à ~1MB par row)
      imageFormat,
      imageSize,
      description || null,
      string_number || null,
      module_number || null,
      latitude || null,
      longitude || null,
      accuracy || null
    ).run()

    return c.json({
      success: true,
      photo_id: result.meta.last_row_id,
      size: imageSize,
      format: imageFormat,
      message: 'Photo uploaded successfully'
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ============================================================================
// GET PHOTOS - Liste photos par audit
// ============================================================================
app.get('/:auditToken', async (c) => {
  try {
    const { DB } = c.env
    const { auditToken } = c.req.param()

    const result = await DB.prepare(`
      SELECT 
        id,
        module_type,
        photo_format,
        photo_size,
        description,
        string_number,
        module_number,
        latitude,
        longitude,
        gps_accuracy,
        captured_at,
        created_at
      FROM photos
      WHERE audit_token = ?
      ORDER BY created_at DESC
    `).bind(auditToken).all()

    return c.json({
      photos: result.results || [],
      count: result.results?.length || 0
    })

  } catch (error: any) {
    console.error('Get photos error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ============================================================================
// GET PHOTO - Récupérer une photo spécifique (avec data)
// ============================================================================
app.get('/:auditToken/:photoId', async (c) => {
  try {
    const { DB } = c.env
    const { auditToken, photoId } = c.req.param()

    const photo = await DB.prepare(`
      SELECT *
      FROM photos
      WHERE audit_token = ? AND id = ?
    `).bind(auditToken, photoId).first()

    if (!photo) {
      return c.json({ error: 'Photo not found' }, 404)
    }

    return c.json({ photo })

  } catch (error: any) {
    console.error('Get photo error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ============================================================================
// DELETE PHOTO
// ============================================================================
app.delete('/:auditToken/:photoId', async (c) => {
  try {
    const { DB } = c.env
    const { auditToken, photoId } = c.req.param()

    await DB.prepare(`
      DELETE FROM photos
      WHERE audit_token = ? AND id = ?
    `).bind(auditToken, photoId).run()

    return c.json({ success: true, message: 'Photo deleted' })

  } catch (error: any) {
    console.error('Delete photo error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ============================================================================
// GET PHOTOS BY MODULE - Filtrer par type de module
// ============================================================================
app.get('/:auditToken/module/:moduleType', async (c) => {
  try {
    const { DB } = c.env
    const { auditToken, moduleType } = c.req.param()

    const result = await DB.prepare(`
      SELECT 
        id,
        module_type,
        photo_format,
        photo_size,
        description,
        string_number,
        module_number,
        latitude,
        longitude,
        gps_accuracy,
        captured_at,
        created_at
      FROM photos
      WHERE audit_token = ? AND module_type = ?
      ORDER BY created_at DESC
    `).bind(auditToken, moduleType.toUpperCase()).all()

    return c.json({
      photos: result.results || [],
      count: result.results?.length || 0,
      module_type: moduleType.toUpperCase()
    })

  } catch (error: any) {
    console.error('Get photos by module error:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app
