// ============================================================================
// MODULE EL - INDEX PRINCIPAL
// ============================================================================
// Module Électroluminescence (EL) - Point d'entrée principal
// Monte toutes les routes API sous le préfixe /api/el

import { Hono } from 'hono'
import auditsRouter from './routes/audits'
import modulesRouter from './routes/modules'
import dashboardRouter from './routes/dashboard'
import { renderAuditELPage } from './view-audit'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const elModule = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// ROUTE VIEW : Interface Audit EL par zone (interconnexion Canvas V2)
// ============================================================================
// GET /audit/zone/:zoneId - Interface visuelle audit EL
elModule.get('/audit/zone/:zoneId', async (c) => {
  const { env } = c
  const zoneId = parseInt(c.req.param('zoneId') || '0')
  
  if (!zoneId) {
    return c.text('Zone ID invalide', 400)
  }
  
  // Récupérer infos zone
  const zoneData = await env.DB.prepare(`
    SELECT z.zone_name, z.plant_id
    FROM pv_zones z
    WHERE z.id = ?
  `).bind(zoneId).first()
  
  if (!zoneData) {
    return c.text('Zone introuvable', 404)
  }
  
  return renderAuditELPage(c, zoneId, zoneData.zone_name as string, zoneData.plant_id as number)
})

// Routes dashboard (statistiques globales)
elModule.route('/dashboard', dashboardRouter)

// Routes pour la gestion des audits (inclut les routes modules intégrées)
// ⚠️ LEGACY: Conservé pour compatibilité avec anciennes URLs
elModule.route('/audit', auditsRouter)

// ✅ NOUVEAU: Routes API par zone (interconnexion Canvas V2 ↔ Module EL)
// Monte modulesRouter sous /zone/:zoneId
elModule.route('/zone/:zoneId', modulesRouter)

export default elModule
