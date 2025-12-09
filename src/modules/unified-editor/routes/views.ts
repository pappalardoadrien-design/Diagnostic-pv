import { Hono } from 'hono'
import { unifiedEditorHtml } from '../views/unified-editor-html'

const views = new Hono<{ Bindings: { DB: D1Database } }>()

// GET /unified-editor/:zoneId
views.get('/:zoneId', async (c) => {
  const zoneId = c.req.param('zoneId')
  
  // Remplacement dynamique de l'ID de zone dans le HTML
  const html = unifiedEditorHtml.replace(/{{ZONE_ID}}/g, zoneId)
  
  return c.html(html)
})

export const viewRoutes = views
