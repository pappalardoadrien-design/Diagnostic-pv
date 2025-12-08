import { Hono } from 'hono'
import { unifiedEditorHtmlBase64 } from '../views/unified-editor-html'

const views = new Hono<{ Bindings: { DB: D1Database } }>()

// Helper to decode base64 (works in Cloudflare Workers using standard atob)
function decodeBase64(str: string): string {
  try {
    return atob(str)
  } catch (e) {
    console.error('Failed to decode HTML template', e)
    return '<h1>Error loading template</h1>'
  }
}

// Pre-decode once to save CPU on requests
const htmlTemplate = decodeBase64(unifiedEditorHtmlBase64)

// GET /unified-editor/:zoneId
views.get('/:zoneId', async (c) => {
  const zoneId = c.req.param('zoneId')
  
  // Remplacement dynamique de l'ID de zone dans le HTML
  const html = htmlTemplate.replace(/{{ZONE_ID}}/g, zoneId)
  
  return c.html(html)
})

export const viewRoutes = views
