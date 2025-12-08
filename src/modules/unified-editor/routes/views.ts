import { Hono } from 'hono'
// @ts-ignore
import editorHtml from '../views/unified-editor.html?raw'

const views = new Hono<{ Bindings: { DB: D1Database } }>()

// GET /unified-editor/:zoneId
views.get('/:zoneId', async (c) => {
  const zoneId = c.req.param('zoneId')
  
  // Remplacement dynamique de l'ID de zone dans le HTML
  const html = editorHtml.replace(/{{ZONE_ID}}/g, zoneId)
  
  return c.html(html)
})

export const viewRoutes = views
