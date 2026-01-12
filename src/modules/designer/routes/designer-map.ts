import { Hono } from 'hono'
import type { Context } from 'hono'

const app = new Hono()

/**
 * GET /pv/plant/:plantId/zone/:zoneId/designer
 * 
 * REDIRECT vers Editor V2 (interface unifiée)
 * L'ancien Designer est déprécié - toutes les routes pointent vers Editor V2
 */
app.get('/pv/plant/:plantId/zone/:zoneId/designer', (c: Context) => {
  const plantId = c.req.param('plantId')
  const zoneId = c.req.param('zoneId')
  return c.redirect(`/pv/plant/${plantId}/zone/${zoneId}/editor/v2`)
})

export default app
