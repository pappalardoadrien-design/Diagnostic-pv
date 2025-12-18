import { Hono } from 'hono'
import type { Context } from 'hono'

const app = new Hono()

// POST /api/pv/zones/:zoneId/save-designer-layout
app.post('/api/pv/zones/:zoneId/save-designer-layout', async (c: Context) => {
  try {
    const zoneId = c.req.param('zoneId')
    const { modules, map_center, zoom } = await c.req.json()
    const { DB } = c.env

    // Vérifier si layout existe
    const existing = await DB.prepare('SELECT id FROM designer_layouts WHERE zone_id = ?').bind(zoneId).first()

    if (existing) {
      await DB.prepare(`
        UPDATE designer_layouts 
        SET modules_json = ?, map_center_json = ?, zoom_level = ?, updated_at = datetime('now')
        WHERE zone_id = ?
      `).bind(JSON.stringify(modules), JSON.stringify(map_center), zoom, zoneId).run()
    } else {
      await DB.prepare(`
        INSERT INTO designer_layouts (zone_id, modules_json, map_center_json, zoom_level)
        VALUES (?, ?, ?, ?)
      `).bind(zoneId, JSON.stringify(modules), JSON.stringify(map_center), zoom).run()
    }

    // --- SYNC TO PV_MODULES (Digital Twin) ---
    // Update real GPS coordinates AND STRINGING in the main modules table
    if (modules && modules.length > 0) {
      // 1. Update GPS
      const stmtGPS = DB.prepare(`
        UPDATE pv_modules 
        SET latitude = ?, longitude = ?
        WHERE id = ?
      `)
      
      const batchGPS = modules.map((m: any) => {
        return stmtGPS.bind(m.lat, m.lon, m.module_id)
      })
      
      await DB.batch(batchGPS)

      // 2. Update Stringing (if defined)
      const modulesWithString = modules.filter((m: any) => m.string_number && m.position_in_string)
      
      if (modulesWithString.length > 0) {
        const stmtString = DB.prepare(`
          UPDATE pv_modules 
          SET string_number = ?, position_in_string = ?
          WHERE id = ?
        `)
        
        const batchString = modulesWithString.map((m: any) => {
          return stmtString.bind(m.string_number, m.position_in_string, m.module_id)
        })
        
        await DB.batch(batchString)
      }
    }
    // -----------------------------------------

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// GET /api/pv/zones/:zoneId/designer-layout
app.get('/api/pv/zones/:zoneId/designer-layout', async (c: Context) => {
  try {
    const zoneId = c.req.param('zoneId')
    const { DB } = c.env

    const layout = await DB.prepare('SELECT * FROM designer_layouts WHERE zone_id = ?').bind(zoneId).first()

    if (!layout) {
      return c.json({ success: false, layout: null })
    }

    return c.json({ 
      success: true, 
      layout: {
        modules: JSON.parse(layout.modules_json as string),
        map_center: JSON.parse(layout.map_center_json as string),
        zoom: layout.zoom_level
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

export default app
