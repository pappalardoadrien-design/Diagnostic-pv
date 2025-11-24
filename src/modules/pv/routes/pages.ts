import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// NOTE: Les templates HTML seront chargés depuis des fichiers externes
// Pour l'instant, nous utilisons des redirections vers les fichiers statiques
// car Cloudflare Workers ne supporte pas fs.readFileSync

// Liste des centrales PV
app.get('/pv/plants', async (c: Context) => {
  return c.redirect('/static/pv/plants.html')
})

// Détail d'une centrale PV  
app.get('/pv/plant/:id', async (c: Context) => {
  return c.redirect('/static/pv/plant.html')
})

// Éditeur cartographique d'une zone
app.get('/pv/plant/:plantId/zone/:zoneId/editor', async (c: Context) => {
  // Redirection vers HTML statique avec query params
  const plantId = c.req.param('plantId')
  const zoneId = c.req.param('zoneId')
  return c.redirect(`/static/pv/editor.html?plantId=${plantId}&zoneId=${zoneId}`)
})

export default app
