/**
 * Diagnostic Hub - Point d'entree principal
 * Plateforme unifiee d'audit PV - Diagnostic Photovoltaique
 * 
 * Architecture: Hono + Cloudflare Workers + D1 SQLite
 * Ce fichier ne contient QUE le routing. Toute la logique est dans src/modules/ et src/pages/
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

// === MODULES API (backend) ===
import elModule from './modules/el'
import pvModule from './modules/pv/routes/plants'
import pvElLinksModule from './modules/pv/routes/el-links'
import designerModule from './modules/designer'
import openSolarModule from './opensolar'
import interconnectModule from './modules/interconnect'
import syncModule from './modules/interconnect/sync'
import syncReverseModule from './modules/interconnect/sync-reverse'
import ivCurvesModule from './modules/iv-curves/routes'
import visualInspectionModule from './modules/visual-inspection/routes'
import { isolationRoutes } from './modules/isolation/routes.js'
import thermiqueRoutes from './modules/thermique/routes.js'
import { unifiedReportRoutes } from './modules/unified-report/routes.js'
import customReportRoutes from './modules/custom-report/routes.js'
import picselliaRoutes from './modules/picsellia-integration/routes.js'
import crmRoutes from './modules/crm/routes'
import planningRoutes from './modules/planning/routes'
import auditsRouter from './modules/audits/routes'
import pvservLegacyRoutes from './modules/el/routes/pvserv-legacy'
import adminRoutes from './modules/admin/routes'
import diagnosticRoutes from './modules/admin/diagnostic-routes'
import auditQualiteRoutes from './modules/audit-qualite/routes'
import diodeTestRoutes from './modules/diode-tests/routes'
import pvservDarkRoutes from './modules/iv-curves/pvserv-dark-routes'
import pipelineRoutes from './modules/crm/pipeline-routes'
import repoweringRoutes from './modules/repowering/routes'
import amoRoutes from './modules/amo/routes'

// === PAGES (frontend HTML) ===
import { getRapportsPage } from './pages/rapports.js'
import { getRapportsCustomPage } from './pages/rapports-custom.js'
import { getIVCurvesPage } from './pages/iv-curves.js'
import { getVisualPage } from './pages/visual.js'
import { getIsolationPage } from './pages/isolation.js'
import { getThermalPage } from './pages/thermal.js'
import { getAuditPhotosPage } from './pages/audit-photos.js'
import { getAuditsCreatePage } from './pages/audits-create'
import { getCrmDashboardPage } from './pages/crm-dashboard'
import { getCrmClientsCreatePage } from './pages/crm-clients-create'
import { getCrmClientsListPage } from './pages/crm-clients-list'
import { getCrmClientsDetailPage } from './pages/crm-clients-detail'
import { getCrmProjectsListPage } from './pages/crm-projects-list'
import { getCrmProjectsCreatePage } from './pages/crm-projects-create'
import { getCrmProjectsDetailPage } from './pages/crm-projects-detail'
import { getPlanningDashboardUnifiedPage } from './pages/planning-dashboard-unified'
import { getPlanningCreatePage } from './pages/planning-create'
import { getLoginPage } from './pages/login'
import crmUnifiedViewPage from './pages/crm-unified-view'
import { getPvPlantsListPage } from './pages/pv-plants-list'
import { getPvPlantDetailPage } from './pages/pv-plant-detail'
import { getPvPlanImportPage } from './pages/pv-plan-import'
import { getPvEditorV3Page } from './pages/pv-editor-v3'
import { getPvPlantCartoPage } from './pages/pv-plant-carto'
import { getPvEditorV2Page } from './pages/pv-editor-v2'
import { getElAuditTerrainPage } from './pages/el-audit-terrain'
import { getToolsPage } from './pages/tools'
import { getAuditQualitePage, getAuditQualitePhotosPage } from './pages/audit-qualite'
import { getRapportQualitePage } from './pages/rapport-qualite'
import { getPipelinePage } from './pages/pipeline'
import { getRepoweringPage } from './pages/repowering'
import { getAmoPage } from './pages/amo'
import { getPvservDarkPage } from './pages/pvserv-dark'

// ============================================================================
// APP SETUP
// ============================================================================

type Bindings = { DB: D1Database; KV: KVNamespace; R2: R2Bucket }
const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors({ origin: ['http://localhost:3000', 'https://*.pages.dev'], credentials: true }))
app.use('/static/*', serveStatic({ root: './public' }))

// Favicon
app.get('/favicon.svg', (c) => {
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#9333ea"/>
  <path d="M30 20 L50 40 L70 20 L70 50 L50 70 L30 50 Z" fill="#fbbf24"/>
  <circle cx="50" cy="45" r="8" fill="#ffffff"/>
</svg>`, 200, { 'Content-Type': 'image/svg+xml' })
})
app.get('/favicon.ico', (c) => c.redirect('/favicon.svg', 301))

// ============================================================================
// API ROUTES (modules backend)
// ============================================================================

app.route('/api/el', elModule)
app.route('/api/pv/plants', pvModule)
app.route('/api/pv', pvElLinksModule)
app.route('/api/interconnect', interconnectModule)
app.route('/api/sync', syncModule)
app.route('/api/sync-reverse', syncReverseModule)
app.route('/api/opensolar', openSolarModule)
app.route('/api/iv-curves', ivCurvesModule)
app.route('/api/visual', visualInspectionModule)
app.route('/api/thermique', thermiqueRoutes)
app.route('/api/thermal', thermiqueRoutes)  // Alias anglais
app.route('/api/isolation', isolationRoutes)
app.route('/api/report/unified', unifiedReportRoutes)
app.route('/api/report/custom', customReportRoutes)
app.route('/api/crm', crmRoutes)
app.route('/api/planning', planningRoutes)
app.route('/api/audits', auditsRouter)
app.route('/api/picsellia', picselliaRoutes)
app.route('/api/audit', pvservLegacyRoutes)
app.route('/api/diagnostic', diagnosticRoutes)
app.route('/api/audit-qualite', auditQualiteRoutes)
app.route('/api/diode-tests', diodeTestRoutes)
app.route('/api/pvserv', pvservDarkRoutes)
app.route('/api/crm/pipeline', pipelineRoutes)
app.route('/api/repowering', repoweringRoutes)
app.route('/api/amo', amoRoutes)
app.route('/admin', adminRoutes)
app.route('/', designerModule)
app.route('/crm/unified', crmUnifiedViewPage)

// ============================================================================
// PAGE ROUTES (frontend HTML)
// ============================================================================

// --- Accueil ---
app.get('/', (c) => c.redirect('/crm/dashboard'))
app.get('/tools', (c) => c.html(getToolsPage()))
app.get('/login', (c) => c.html(getLoginPage()))

// --- Dashboard & CRM ---
app.get('/dashboard', (c) => c.html(getCrmDashboardPage()))
app.get('/crm/dashboard', (c) => c.html(getCrmDashboardPage()))
app.get('/crm/clients', (c) => c.html(getCrmClientsListPage()))
app.get('/crm/clients/detail', (c) => c.html(getCrmClientsDetailPage()))
app.get('/crm/clients/create', (c) => c.html(getCrmClientsCreatePage()))
app.get('/crm/clients/:id', (c) => {
  const id = c.req.param('id')
  if (id === 'detail' || id === 'create') return c.notFound()
  return c.redirect(`/crm/clients/detail?id=${id}`)
})
app.get('/crm/projects', (c) => c.html(getCrmProjectsListPage()))
app.get('/crm/projects/create', (c) => c.html(getCrmProjectsCreatePage()))
app.get('/crm/projects/detail', (c) => c.html(getCrmProjectsDetailPage()))

// --- Pipeline Commercial ---
app.get('/crm/pipeline', (c) => c.html(getPipelinePage()))

// --- Repowering ---
app.get('/repowering', (c) => c.html(getRepoweringPage()))

// --- AMO ---
app.get('/amo', (c) => c.html(getAmoPage()))

// --- Planning ---
app.get('/planning', (c) => c.html(getPlanningDashboardUnifiedPage()))
app.get('/planning/create', (c) => c.html(getPlanningCreatePage()))

// --- Audits & EL ---
app.get('/audits/create', (c) => c.html(getAuditsCreatePage()))
app.get('/audit/:token/photos', (c) => c.html(getAuditPhotosPage(c.req.param('token'))))
app.get('/audit/:token', async (c) => c.html(getElAuditTerrainPage(c.req.param('token'))))
app.get('/audit/create', (c) => c.redirect('/audits/create'))
app.get('/el', (c) => c.redirect('/audits/create?type=EL'))

// --- Audit Qualité Terrain ---
app.get('/audit-qualite/:missionId', (c) => c.html(getAuditQualitePage(c.req.param('missionId'))))
app.get('/audit-qualite/:missionId/photos', (c) => c.html(getAuditQualitePhotosPage(c.req.param('missionId'))))
app.get('/rapport-qualite/:rapportId', (c) => c.html(getRapportQualitePage(c.req.param('rapportId'))))


// --- Modules metier (pages) ---
app.get('/rapports', (c) => c.html(getRapportsPage()))
app.get('/rapports/custom', (c) => c.html(getRapportsCustomPage()))
app.get('/iv-curves', (c) => c.html(getIVCurvesPage()))
app.get('/iv', (c) => c.redirect('/iv-curves'))
app.get('/pvserv-dark', (c) => c.html(getPvservDarkPage()))
app.get('/dark-iv', (c) => c.redirect('/pvserv-dark'))
app.get('/visual', (c) => c.html(getVisualPage()))
app.get('/isolation', (c) => c.html(getIsolationPage()))
app.get('/thermal', (c) => c.html(getThermalPage()))
app.get('/thermal/:token', (c) => c.html(getThermalPage()))

// --- PV Cartography ---
app.get('/pv/plants', (c) => c.html(getPvPlantsListPage()))
app.get('/pv/installations', (c) => c.redirect('/pv/plants'))
app.get('/pv/plant/:id', (c) => c.html(getPvPlantDetailPage(c.req.param('id'))))
app.get('/pv/plant/:id/import-plan', (c) => c.html(getPvPlanImportPage(c.req.param('id'))))
app.get('/pv/plant/:id/carto', (c) => c.html(getPvPlantCartoPage(c.req.param('id'))))
app.get('/pv/plant/:plantId/zone/:zoneId/editor', (c) => {
  return c.redirect(`/pv/plant/${c.req.param('plantId')}/zone/${c.req.param('zoneId')}/editor/v3`)
})
app.get('/pv/plant/:plantId/zone/:zoneId/editor/v3', (c) => {
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate')
  return c.html(getPvEditorV3Page(c.req.param('plantId'), c.req.param('zoneId')))
})
app.get('/pv/plant/:plantId/zone/:zoneId/editor/v2', async (c) => {
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
  return c.html(getPvEditorV2Page(c.req.param('plantId'), c.req.param('zoneId')))
})
app.get('/pv/plant/:plantId/designer', (c) => c.redirect(`/pv/plant/${c.req.param('plantId')}`))

export default app
