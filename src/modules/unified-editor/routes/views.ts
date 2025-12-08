import { Hono } from 'hono'
// @ts-ignore
import editorHtml from '../views/unified-editor.html?raw'

const views = new Hono<{ Bindings: { DB: D1Database } }>()

// GET /unified-editor/:zoneId
views.get('/:zoneId', async (c) => {
  return c.html(editorHtml)
})

export const viewRoutes = views
