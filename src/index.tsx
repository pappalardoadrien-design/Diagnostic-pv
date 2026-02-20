import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { PVservParser } from './pvserv-parser.js'
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
import girasoleRoutes from './modules/girasole/routes'
import crmRoutes from './modules/crm/routes'
import planningRoutes from './modules/planning/routes'
import auditsRouter from './modules/audits/routes'
import { getRapportsPage } from './pages/rapports.js'
import { getRapportsCustomPage } from './pages/rapports-custom.js'
import { getIVCurvesPage } from './pages/iv-curves.js'
import { getVisualPage } from './pages/visual.js'
import { getIsolationPage } from './pages/isolation.js'
import { getThermalPage } from './pages/thermal.js'
import { getAuditPhotosPage } from './pages/audit-photos.js'
import { getGirasoleDashboardPage } from './pages/girasole-dashboard.js'
import { getGirasoleChecklistPage } from './pages/girasole-checklist.js'
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
import { generatePhysicalModulesGrid, getStatusLabel } from './modules/el/report-helpers'
import { getToolsPage } from './pages/tools'

// Types pour l'environnement Cloudflare
type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// Configuration CORS pour collaboration temps réel
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  credentials: true
}))

// Serveur de fichiers statiques
app.use('/static/*', serveStatic({ root: './public' }))

// Favicon
app.get('/favicon.svg', (c) => {
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#9333ea"/>
  <path d="M30 20 L50 40 L70 20 L70 50 L50 70 L30 50 Z" fill="#fbbf24"/>
  <circle cx="50" cy="45" r="8" fill="#ffffff"/>
</svg>`, 200, { 'Content-Type': 'image/svg+xml' })
})

app.get('/favicon.ico', (c) => {
  return c.redirect('/favicon.svg', 301)
})

// ============================================================================
// MODULE EL - ARCHITECTURE MODULAIRE (Point 4.1 + 4.3)
// ============================================================================
app.route('/api/el', elModule)

// ============================================================================
// MODULE PV CARTOGRAPHY - ARCHITECTURE MODULAIRE (NOUVEAU - NON-DESTRUCTIF)
// ============================================================================
app.route('/api/pv/plants', pvModule)
app.route('/api/pv', pvElLinksModule)

// ============================================================================
// UNIFICATION CARTOGRAPHIE - Toutes les routes redirigent vers Editor V2
// ============================================================================
// Editor V2 = Interface unique pour placement modules sur carte satellite

// Ancien Editor → Editor V3 (nouveau design)
app.get('/pv/plant/:plantId/zone/:zoneId/editor', (c) => {
  const plantId = c.req.param('plantId')
  const zoneId = c.req.param('zoneId')
  return c.redirect(`/pv/plant/${plantId}/zone/${zoneId}/editor/v3`)
})

// Editor V3 - Nouvelle interface DiagPV OS
app.get('/pv/plant/:plantId/zone/:zoneId/editor/v3', (c) => {
  const plantId = c.req.param('plantId')
  const zoneId = c.req.param('zoneId')
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate')
  return c.html(getPvEditorV3Page(plantId, zoneId))
})

// Designer sans zone → page détail centrale
app.get('/pv/plant/:plantId/designer', (c) => {
  const plantId = c.req.param('plantId')
  return c.redirect(`/pv/plant/${plantId}`)
})

app.route('/', designerModule)

// ============================================================================
// MODULE INTERCONNECT - Liaison entre modules (EL  PV Carto)
// ============================================================================
// Permet navigation cohérente entre audits EL et centrales PV
// Routes:
// - POST /api/interconnect/link-audit-plant  Lier audit EL à centrale PV
// - GET /api/interconnect/audit/:token/plant  Obtenir centrale liée
// - GET /api/interconnect/plant/:plantId/audits  Audits EL d'une centrale
// - POST /api/interconnect/link-audit-zone  Lier audit à zone spécifique
// - GET /api/interconnect/audit/:token/zones  Zones liées à audit
// ============================================================================
app.route('/api/interconnect', interconnectModule)

// ============================================================================
// MODULE SYNC - Synchronisation automatique EL  PV Carto
// ============================================================================
// Synchronise modules et défauts entre Module EL et PV Cartography
// Routes:
// - POST /api/sync/sync-audit-to-plant  Sync auto audit EL  centrale PV
// - GET /api/sync/audit/:token/sync-status  État synchronisation
// ============================================================================
app.route('/api/sync', syncModule)

// ============================================================================
// MODULE SYNC-REVERSE - Synchronisation PV Carto  Audit EL
// ============================================================================
// Crée des audits EL depuis modélisation PV Cartography
// Routes:
// - POST /api/sync-reverse/create-audit-from-plant  Créer audit depuis centrale PV
// - GET /api/sync-reverse/plant/:plantId/can-create-audit  Vérifier si création possible
// ============================================================================
app.route('/api/sync-reverse', syncReverseModule)

// ============================================================================
// MODULE OPENSOLAR DXF IMPORT - ISOLÉ (Point 5.0 - Module autonome)
// ============================================================================
// Module complètement isolé pour import DXF OpenSolar
// Routes:
// - GET /opensolar  Interface HTML upload DXF
// - POST /api/opensolar/parse-dxf  Parser fichier DXF
// - POST /api/opensolar/import-modules  Importer modules dans DB
// - GET /api/opensolar/test  Test endpoint
// ============================================================================
app.route('/api/opensolar', openSolarModule)

// ============================================================================
// MODULE IV - COURBES I-V (Phase 2 - Module 1/5)
// ============================================================================
// Module Courbes I-V pour mesures PVServ (TXT et Excel)
// Routes:
// - POST /api/iv-curves/upload  Upload fichier PVServ (TXT/XLSM)
// - GET /api/iv-curves/:id  Recuperer courbe par ID
// - GET /api/iv-curves/by-string/:stringNumber  Courbes par string
// - GET /api/iv-curves  Liste courbes (filtres optionnels)
// - DELETE /api/iv-curves/:id  Supprimer courbe
// - GET /api/iv-curves/dashboard/overview  Dashboard unifie IV + EL
// ============================================================================
app.route('/api/iv-curves', ivCurvesModule)

// ============================================================================
// MODULE VISUAL INSPECTION - CONTROLES VISUELS IEC 62446-1 (Phase 2 - Module 2/5)
// ============================================================================
// Module Controles Visuels terrain conforme norme IEC 62446-1
// Routes:
// - POST /api/visual/inspection/create  Creer nouvelle inspection
// - GET /api/visual/inspection/:token  Recuperer inspection complete
// - PUT /api/visual/inspection/:token/item/:itemId  Mettre a jour item checklist
// - POST /api/visual/inspection/:token/defect  Creer defaut mecanique
// - GET /api/visual/checklist  Obtenir checklist IEC standardisee
// - GET /api/visual/inspections  Liste toutes inspections
// ============================================================================
app.route('/api/visual', visualInspectionModule)

// ============================================================================
// MODULE THERMIQUE - THERMOGRAPHIE IR (Rétabli)
// ============================================================================
app.route('/api/thermique', thermiqueRoutes)

// ============================================================================
// MODULE ISOLATION - TESTS D'ISOLEMENT IEC 62446 (Phase 2 - Module 4/6)
// ============================================================================
// Module Tests Isolement DC/AC conformes norme IEC 62446
// Routes:
// - POST /api/isolation/test/create  Creer nouveau test isolement
// - GET /api/isolation/test/:token  Recuperer test par token
// - PUT /api/isolation/test/:token  Mettre a jour test
// - DELETE /api/isolation/test/:token  Supprimer test
// - GET /api/isolation/tests  Lister tests (filtres: plantId, testType, isConform, dates)
// - GET /api/isolation/plant/:plantId/history  Historique mesures centrale (graphiques)
// - POST /api/isolation/import/benning-csv  Import CSV Benning IT 130 (✅ OPÉRATIONNEL)
// ============================================================================
app.route('/api/isolation', isolationRoutes)

// ============================================================================
// MODULE RAPPORT UNIFIÉ - AGGREGATION MULTI-MODULES (Phase 2 - Module 6/6)
// ============================================================================
// Module Rapport Unifié pour génération rapports professionnels multi-modules
// Agrège données de: EL, IV, Visuels, Isolation, Thermique
// Routes:
// - POST /api/report/unified/generate  Générer rapport unifié (PDF HTML)
// - GET /api/report/unified/preview  Aperçu données disponibles par centrale
// - GET /api/report/unified/:reportToken  Récupérer rapport généré (TODO Phase 3)
// ============================================================================
app.route('/api/report/unified', unifiedReportRoutes)

// ============================================================================
// MODULE RAPPORT CUSTOM - RAPPORTS FLEXIBLES ADAPTÉS (Phase 5 - Option C)
// ============================================================================
// Module Rapport Flexible pour génération de rapports adaptés au type d'audit
// Sélection dynamique des modules selon cahier des charges
// Routes:
// - GET /api/report/custom/templates  Liste templates disponibles
// - POST /api/report/custom/check-availability  Vérifier données disponibles
// - POST /api/report/custom/generate  Générer rapport flexible
// ============================================================================
app.route('/api/report/custom', customReportRoutes)

// === MODULE GIRASOLE ===
app.route('/api/girasole', girasoleRoutes)

// ============================================================================
// MODULES BUSINESS (CRM, PLANNING, AUDITS) - MIGRÉS DE WEBAPP
// ============================================================================
app.route('/api/crm', crmRoutes)
app.route('/crm/unified', crmUnifiedViewPage)
app.route('/api/planning', planningRoutes)
app.route('/api/audits', auditsRouter)

// Page de création d'audit unifiée (Flux CRM -> Audit)
app.get('/audits/create', (c) => {
  return c.html(getAuditsCreatePage())
})

// Page Upload Photos EL (Integration Picsellia)
app.get('/audit/:token/photos', (c) => {
  const token = c.req.param('token')
  return c.html(getAuditPhotosPage(token))
})

// === PAGES CRM ===
app.get('/crm/dashboard', (c) => c.html(getCrmDashboardPage()))
app.get('/dashboard', (c) => c.html(getCrmDashboardPage())) // Alias
app.get('/crm/clients', (c) => c.html(getCrmClientsListPage()))
app.get('/crm/clients/detail', (c) => c.html(getCrmClientsDetailPage()))
app.get('/crm/clients/create', (c) => c.html(getCrmClientsCreatePage()))
// Route alternative /crm/clients/:id → redirige vers /crm/clients/detail?id=
app.get('/crm/clients/:id', (c) => {
  const id = c.req.param('id')
  if (id === 'detail' || id === 'create') return c.notFound()
  return c.redirect(`/crm/clients/detail?id=${id}`)
})
app.get('/crm/projects', (c) => c.html(getCrmProjectsListPage()))
app.get('/crm/projects/create', (c) => c.html(getCrmProjectsCreatePage()))
app.get('/crm/projects/detail', (c) => c.html(getCrmProjectsDetailPage()))

// === PAGES PLANNING ===
app.get('/planning', (c) => c.html(getPlanningDashboardUnifiedPage()))
app.get('/planning/create', (c) => c.html(getPlanningCreatePage()))

// === LOGIN ===
app.get('/login', (c) => c.html(getLoginPage()))

// Page Dashboard GIRASOLE
app.get('/girasole/dashboard', (c) => {
  return c.html(getGirasoleDashboardPage());
})

// Pages Checklist GIRASOLE
app.get('/girasole/checklist/conformite/:projectId', (c) => {
  const projectId = c.req.param('projectId');
  return c.html(getGirasoleChecklistPage(projectId, 'CONFORMITE'));
})

app.get('/girasole/checklist/toiture/:projectId', (c) => {
  const projectId = c.req.param('projectId');
  return c.html(getGirasoleChecklistPage(projectId, 'TOITURE'));
})

// ============================================================================
// MODULE PICSELLIA AI - INTÉGRATION IA ANALYSE PHOTOS EL (Phase 1)
// ============================================================================
// Module Picsellia AI pour analyse automatique photos électroluminescence
// Architecture 100% additive - Aucune modification code existant
// Mode MOCK intégré pour développement sans API keys
// Routes:
// - POST /api/picsellia/upload-photos  Upload photos vers R2 + DB
// - GET /api/picsellia/photos/:auditToken  Liste photos audit
// - POST /api/picsellia/analyze-audit  Lancer analyse IA batch
// - GET /api/picsellia/review/:auditToken  Comparer IA vs saisie manuelle
// - POST /api/picsellia/validate  Validation humaine résultats IA
// - GET /api/picsellia/statistics/:auditToken  Statistiques analyse IA
// ============================================================================
app.route('/api/picsellia', picselliaRoutes)

// ============================================================================
// ROUTES LEGACY (PVserv parser)
// ============================================================================

// ============================================================================
// API ROUTES - MESURES PVSERV
// ============================================================================

// Parse contenu PVserv
app.post('/api/audit/:token/parse-pvserv', async (c) => {
  const { content } = await c.req.json()
  
  if (!content) {
    return c.json({ error: 'Contenu fichier requis' }, 400)
  }

  try {
    const parser = new PVservParser()
    const results = parser.parseFile(content)
    
    return c.json(results)
  } catch (error) {
    console.error('Erreur parsing PVserv:', error)
    return c.json({ 
      error: 'Erreur parsing PVserv: ' + error.message,
      success: false 
    }, 500)
  }
})

// Sauvegarder mesures PVserv
app.post('/api/audit/:token/save-measurements', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  const { measurements } = await c.req.json()

  if (!measurements || measurements.length === 0) {
    return c.json({ error: 'Aucune mesure à sauvegarder' }, 400)
  }

  try {
    // Suppression anciennes mesures
    await env.DB.prepare(
      'DELETE FROM pvserv_measurements WHERE audit_token = ?'
    ).bind(token).run()

    // Insertion nouvelles mesures
    const parser = new PVservParser()
    const dbData = parser.formatForDatabase(measurements, token)

    for (const measurement of dbData) {
      await env.DB.prepare(`
        INSERT INTO pvserv_measurements (
          audit_token, string_number, module_number, ff, rds, uf,
          measurement_type, iv_curve_data, raw_line, line_number, valid
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        measurement.audit_token, measurement.string_number, measurement.module_number,
        measurement.ff, measurement.rds, measurement.uf, measurement.measurement_type,
        measurement.iv_curve_data, measurement.raw_line, measurement.line_number,
        measurement.valid ? 1 : 0
      ).run()
    }

    return c.json({ 
      success: true, 
      saved: dbData.length 
    })

  } catch (error) {
    console.error('Erreur sauvegarde mesures:', error)
    return c.json({ 
      error: 'Erreur sauvegarde: ' + error.message 
    }, 500)
  }
})

// Récupérer mesures existantes
app.get('/api/audit/:token/measurements', async (c) => {
  const { env } = c
  const token = c.req.param('token')

  try {
    const measurements = await env.DB.prepare(
      'SELECT * FROM pvserv_measurements WHERE audit_token = ? ORDER BY module_number'
    ).bind(token).all()

    return c.json({ measurements: measurements.results })
  } catch (error) {
    console.error('Erreur récupération mesures:', error)
    return c.json({ error: 'Erreur récupération mesures' }, 500)
  }
})

// Génération rapport PDF
app.get('/api/audit/:token/report', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  // Récupération données complètes audit
  const audit = await env.DB.prepare(
    'SELECT * FROM audits WHERE token = ?'
  ).bind(token).first()
  
  if (!audit) {
    return c.json({ error: 'Audit non trouvé' }, 404)
  }
  
  const modules = await env.DB.prepare(
    'SELECT * FROM modules WHERE audit_token = ? ORDER BY string_number, position_in_string'
  ).bind(token).all()
  
  const stats = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'ok' THEN 1 ELSE 0 END) as ok,
      SUM(CASE WHEN status = 'inequality' THEN 1 ELSE 0 END) as inequality,
      SUM(CASE WHEN status = 'microcracks' THEN 1 ELSE 0 END) as microcracks,
      SUM(CASE WHEN status = 'dead' THEN 1 ELSE 0 END) as dead,
      SUM(CASE WHEN status = 'string_open' THEN 1 ELSE 0 END) as string_open,
      SUM(CASE WHEN status = 'not_connected' THEN 1 ELSE 0 END) as not_connected
    FROM modules WHERE audit_token = ?
  `).bind(token).first()

  // Récupération mesures PVserv si disponibles
  const measurements = await env.DB.prepare(
    'SELECT * FROM pvserv_measurements WHERE audit_token = ? ORDER BY module_number'
  ).bind(token).all()
  
  // Génération HTML pour rapport PDF (sera converti côté client)
  const reportHtml = await generateReportHTML(audit, modules.results, stats, measurements.results)
  
  return c.html(reportHtml)
})

// ============================================================================
// ROUTE URGENCE - RÉPARATION BASE DE DONNÉES (FORCE UPDATE)
// ============================================================================
app.get('/admin/emergency-db-fix', async (c) => {
  const { DB } = c.env
  const logs: string[] = []
  
  const runQuery = async (query: string, label: string) => {
    try {
      await DB.prepare(query).run()
      logs.push(`✅ SUCCÈS: ${label}`)
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        logs.push(`ℹ️ INFO: ${label} (Déjà existant)`)
      } else {
        logs.push(`❌ ERREUR: ${label} - ${e.message}`)
      }
    }
  }

  // 1. Mettre à jour la table PROJECTS
  await runQuery("ALTER TABLE projects ADD COLUMN inverter_count INTEGER DEFAULT 0", "Projects: Ajout inverter_count")
  await runQuery("ALTER TABLE projects ADD COLUMN inverter_brand TEXT", "Projects: Ajout inverter_brand")
  await runQuery("ALTER TABLE projects ADD COLUMN junction_box_count INTEGER DEFAULT 0", "Projects: Ajout junction_box_count")
  await runQuery("ALTER TABLE projects ADD COLUMN strings_configuration TEXT", "Projects: Ajout strings_configuration")
  await runQuery("ALTER TABLE projects ADD COLUMN technical_notes TEXT", "Projects: Ajout technical_notes")
  
  // 1.1 Ajout colonnes "modernes" manquantes (si ancien schéma 0004)
  await runQuery("ALTER TABLE projects ADD COLUMN total_power_kwp REAL", "Projects: Ajout total_power_kwp")
  await runQuery("ALTER TABLE projects ADD COLUMN module_count INTEGER", "Projects: Ajout module_count")
  await runQuery("ALTER TABLE projects ADD COLUMN module_type TEXT", "Projects: Ajout module_type")
  await runQuery("ALTER TABLE projects ADD COLUMN inverter_type TEXT", "Projects: Ajout inverter_type")
  await runQuery("ALTER TABLE projects ADD COLUMN address_street TEXT", "Projects: Ajout address_street")
  await runQuery("ALTER TABLE projects ADD COLUMN address_postal_code TEXT", "Projects: Ajout address_postal_code")
  await runQuery("ALTER TABLE projects ADD COLUMN address_city TEXT", "Projects: Ajout address_city")
  await runQuery("ALTER TABLE projects ADD COLUMN gps_latitude REAL", "Projects: Ajout gps_latitude")
  await runQuery("ALTER TABLE projects ADD COLUMN gps_longitude REAL", "Projects: Ajout gps_longitude")

  // 2. Mettre à jour la table EL_AUDITS
  await runQuery("ALTER TABLE el_audits ADD COLUMN configuration_json TEXT", "EL Audits: Ajout configuration_json")
  await runQuery("ALTER TABLE el_audits ADD COLUMN inverter_count INTEGER", "EL Audits: Ajout inverter_count")
  await runQuery("ALTER TABLE el_audits ADD COLUMN junction_boxes INTEGER", "EL Audits: Ajout junction_boxes")

  // 3. Mettre à jour la table EL_MODULES (positions physiques)
  await runQuery("ALTER TABLE el_modules ADD COLUMN physical_row INTEGER", "EL Modules: Ajout physical_row")
  await runQuery("ALTER TABLE el_modules ADD COLUMN physical_col INTEGER", "EL Modules: Ajout physical_col")

  // 3.1 PV_PLANTS - Liaison avec CRM clients
  await runQuery("ALTER TABLE pv_plants ADD COLUMN client_id INTEGER REFERENCES crm_clients(id)", "PV Plants: Ajout client_id")
  await runQuery("CREATE INDEX IF NOT EXISTS idx_pv_plants_client_id ON pv_plants(client_id)", "PV Plants: Index client_id")
  
  // 3.2 Mise à jour ALBAGNAC 2 avec client Broussy Energie (client_id = 9)
  await runQuery("UPDATE pv_plants SET client_id = 9 WHERE plant_name = 'ALBAGNAC 2' AND client_id IS NULL", "PV Plants: Liaison ALBAGNAC 2 → Broussy Energie")

  // 4. Mettre à jour les tables VISUAL et PROJECTS (Girasole & Thermal)
  await runQuery("ALTER TABLE visual_inspections ADD COLUMN checklist_type TEXT DEFAULT 'IEC_62446'", "Visual: Ajout checklist_type")
  await runQuery("ALTER TABLE visual_inspections ADD COLUMN project_id INTEGER", "Visual: Ajout project_id")
  await runQuery("ALTER TABLE projects ADD COLUMN is_girasole INTEGER DEFAULT 0", "Projects: Ajout is_girasole")
  await runQuery("ALTER TABLE projects ADD COLUMN id_referent TEXT", "Projects: Ajout id_referent")
  await runQuery("ALTER TABLE thermal_measurements ADD COLUMN audit_token TEXT", "Thermal: Ajout audit_token")

  // 4.5 Création table el_audit_notes si elle n'existe pas
  await runQuery(`
    CREATE TABLE IF NOT EXISTS el_audit_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      el_audit_id INTEGER NOT NULL,
      audit_token TEXT NOT NULL,
      note_type TEXT DEFAULT 'text' CHECK(note_type IN ('text', 'voice', 'photo')),
      content TEXT,
      audio_url TEXT,
      photo_url TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (el_audit_id) REFERENCES el_audits(id) ON DELETE CASCADE
    )
  `, "EL Audit Notes: Création table")
  await runQuery("CREATE INDEX IF NOT EXISTS idx_el_audit_notes_audit ON el_audit_notes(el_audit_id)", "EL Audit Notes: Index audit_id")
  await runQuery("CREATE INDEX IF NOT EXISTS idx_el_audit_notes_token ON el_audit_notes(audit_token)", "EL Audit Notes: Index token")

  // 4.6 Création table el_audit_plants si elle n'existe pas  
  await runQuery(`
    CREATE TABLE IF NOT EXISTS el_audit_plants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      el_audit_id INTEGER NOT NULL,
      audit_token TEXT NOT NULL,
      plant_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (el_audit_id) REFERENCES el_audits(id) ON DELETE CASCADE,
      FOREIGN KEY (plant_id) REFERENCES pv_plants(id) ON DELETE CASCADE,
      UNIQUE(el_audit_id, plant_id)
    )
  `, "EL Audit Plants: Création table liaison")
  await runQuery("CREATE INDEX IF NOT EXISTS idx_el_audit_plants_audit ON el_audit_plants(el_audit_id)", "EL Audit Plants: Index audit_id")
  await runQuery("CREATE INDEX IF NOT EXISTS idx_el_audit_plants_plant ON el_audit_plants(plant_id)", "EL Audit Plants: Index plant_id")

  // 5. MIGRATION DES DONNÉES JSON DANS NOTES (NOUVEAU)
  try {
    const projects = await DB.prepare("SELECT id, notes FROM projects WHERE notes LIKE '%[MIGRATION_PENDING_DATA]%'").all();
    if (projects.results && projects.results.length > 0) {
      logs.push(`🔄 MIGRATION: ${projects.results.length} projets à migrer trouvés.`);
      
      for (const project of projects.results as any[]) {
        try {
          const notes = project.notes as string;
          const jsonMatch = notes.match(/\[MIGRATION_PENDING_DATA\](.*)/s); // Capture everything after the tag
          
          if (jsonMatch && jsonMatch[1]) {
            const jsonData = JSON.parse(jsonMatch[1]);
            
            // Prepare update query dynamically based on what's in JSON
            const mapping: Record<string, string> = {
              'inverter_count': 'inverter_count',
              'address_street': 'address_street',
              'total_power_kwp': 'total_power_kwp',
              'strings_configuration': 'strings_configuration',
              'module_type': 'module_type',
              'inverter_brand': 'inverter_brand',
              'inverter_type': 'inverter_type',
              'address_postal_code': 'address_postal_code',
              'address_city': 'address_city',
              'gps_latitude': 'gps_latitude',
              'gps_longitude': 'gps_longitude'
            };

            const updates: string[] = [];
            const values: any[] = [];

            for (const [jsonKey, dbCol] of Object.entries(mapping)) {
              if (jsonData[jsonKey] !== undefined && jsonData[jsonKey] !== null) {
                updates.push(`${dbCol} = ?`);
                values.push(jsonData[jsonKey]);
              }
            }
            
            // Clean the notes (remove the JSON part)
            const cleanNotes = notes.replace(/\[MIGRATION_PENDING_DATA\].*/s, '').trim();
            updates.push("notes = ?");
            values.push(cleanNotes);
            
            values.push(project.id); // For WHERE clause

            if (updates.length > 0) {
              const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`;
              await DB.prepare(query).bind(...values).run();
              logs.push(`✅ MIGRATION PROJET #${project.id}: Données extraites et notes nettoyées.`);
            }
          }
        } catch (err: any) {
          logs.push(`❌ ERREUR MIGRATION PROJET #${project.id}: ${err.message}`);
        }
      }
    } else {
      logs.push(`ℹ️ MIGRATION: Aucun projet nécessitant une migration trouvé.`);
    }
  } catch (e: any) {
    logs.push(`❌ ERREUR GLOBAL MIGRATION: ${e.message}`);
  }

  return c.html(`
    <html>
      <body style="font-family: monospace; padding: 20px; background: #111; color: #0f0;">
        <h1>Rapport de Réparation BDD</h1>
        <ul>
          ${logs.map(l => `<li>${l}</li>`).join('')}
        </ul>
        <br>
        <a href="/" style="color: #fff; font-size: 20px;">RETOUR ACCUEIL</a>
      </body>
    </html>
  `)
})

// ============================================================================
// API DIAGNOSTIC - VÉRIFICATION INTERCONNEXION DONNÉES
// ============================================================================
app.get('/api/diagnostic/interconnect', async (c) => {
  const { DB } = c.env
  
  try {
    // 1. Stats CRM
    const clients = await DB.prepare("SELECT COUNT(*) as count FROM crm_clients").first() as any
    
    // 2. Stats PV Plants avec liaison client
    const plants = await DB.prepare(`
      SELECT p.id, p.plant_name, p.client_id, c.company_name as client_name,
             (SELECT COUNT(*) FROM pv_zones WHERE plant_id = p.id) as zone_count,
             (SELECT COUNT(*) FROM pv_modules m JOIN pv_zones z ON m.zone_id = z.id WHERE z.plant_id = p.id) as module_count
      FROM pv_plants p
      LEFT JOIN crm_clients c ON p.client_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all() as any
    
    // 3. Stats Audits EL
    const audits = await DB.prepare(`
      SELECT COUNT(*) as count FROM el_audits
    `).first() as any
    
    // 4. Liaisons EL ↔ PV existantes
    const links = await DB.prepare(`
      SELECT COUNT(*) as count FROM pv_cartography_audit_links
    `).first() as any
    
    // 5. KPIs globaux
    const kpis = {
      clients_total: clients?.count || 0,
      plants_total: plants?.results?.length || 0,
      plants_linked_to_client: plants?.results?.filter((p: any) => p.client_id !== null).length || 0,
      audits_total: audits?.count || 0,
      el_pv_links: links?.count || 0
    }
    
    return c.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis,
      plants: plants?.results || [],
      interconnection_status: {
        crm_pv: kpis.plants_linked_to_client > 0 ? '✅ Actif' : '⚠️ Partiel',
        pv_el: kpis.el_pv_links > 0 ? '✅ Actif' : '⚠️ Non lié (utiliser Editor V2 > Sync EL)',
        summary: `${kpis.plants_linked_to_client}/${kpis.plants_total} centrales liées à un client`
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// INTERFACE FRONTEND
// ============================================================================

// ============================================================================
// PAGE D'ACCUEIL - REDIRECTION VERS CRM (DIAGPV OS V2)
// ============================================================================
app.get('/', (c) => {
  return c.redirect('/crm/dashboard');
})

// ANCIENNE PAGE D'ACCUEIL (ACCESSIBLE VIA /TOOLS SI BESOIN)
// ANCIENNE PAGE D'ACCUEIL (ACCESSIBLE VIA /TOOLS SI BESOIN)
app.get('/tools', (c) => {
  return c.html(getToolsPage())
})


// ============================================================================
// ROUTE /RAPPORTS - INTERFACE GESTION RAPPORTS UNIFIÉS (Phase 4C)
// ============================================================================
app.get('/rapports', (c) => {
  return c.html(getRapportsPage())
})

// ============================================================================
// ROUTE /RAPPORTS/CUSTOM - INTERFACE BUILDER RAPPORTS FLEXIBLES (Phase 5 - Option C)
// ============================================================================
app.get('/rapports/custom', (c) => {
  return c.html(getRapportsCustomPage())
})

// ============================================================================
// ROUTE /IV-CURVES - INTERFACE MODULE COURBES I-V
// ============================================================================
app.get('/iv-curves', (c) => {
  return c.html(getIVCurvesPage())
})

// Alias /iv → /iv-curves
app.get('/iv', (c) => {
  return c.redirect('/iv-curves')
})

// ============================================================================
// ROUTE /VISUAL - INTERFACE MODULE CONTRÔLES VISUELS IEC 62446-1
// ============================================================================
app.get('/visual', (c) => {
  return c.html(getVisualPage())
})

// ============================================================================
// ROUTE /ISOLATION - INTERFACE MODULE TESTS ISOLATION
// ============================================================================
app.get('/isolation', (c) => {
  return c.html(getIsolationPage())
})

// ============================================================================
// ROUTE /THERMAL - INTERFACE MODULE THERMOGRAPHIE
// ============================================================================
app.get('/thermal', (c) => {
  return c.html(getThermalPage())
})
app.get('/thermal/:token', (c) => {
  return c.html(getThermalPage())
})

// ============================================================================
// ROUTE MODULE EL - ACCÈS DIRECT CRÉATION
// ============================================================================
app.get('/el', (c) => {
  // Redirection vers le Wizard de création qui pré-coche "EL"
  return c.redirect('/audits/create?type=EL');
})

// Redirection /audit/create vers /audits/create (nouvelle page unifiée)
app.get('/audit/create', (c) => {
  return c.redirect('/audits/create')
})


// Page d'audit terrain nocturne
app.get('/audit/:token', async (c) => {
  const token = c.req.param('token')
  return c.html(getElAuditTerrainPage(token))
})


// [CLEANUP 2026-02-20] Route /dashboard dupliquée supprimée (313 lignes de code mort)
// La route active /dashboard est en ligne ~262 → getCrmDashboardPage()
// Ancien code récupérable via git: commit avant "CLEANUP: Remove duplicate /dashboard route"
// ============================================================================
// ROUTE PV CARTOGRAPHY - Liste centrales PV (UNIFIÉ DiagPV OS)
// ============================================================================
app.get('/pv/plants', (c) => {
  return c.html(getPvPlantsListPage())
})

// ============================================================================
// ROUTE PV CARTOGRAPHY - ANCIEN CODE (conservé pour référence)
// ============================================================================
/*
app.get('/pv/plants-old', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PV Cartography - Centrales Photovoltaïques</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-7xl">
            <!-- Header -->
            <div class="mb-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h1 class="text-4xl font-black text-purple-400 mb-2">
                            <i class="fas fa-solar-panel mr-3"></i>PV CARTOGRAPHY
                        </h1>
                        <p class="text-gray-400 text-lg">Modélisation & Cartographie Centrales Photovoltaïques</p>
                    </div>
                    <div class="flex gap-3">
                        <a href="/" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-bold">
                            <i class="fas fa-home mr-2"></i>ACCUEIL
                        </a>
                        <a href="/dashboard" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold">
                            <i class="fas fa-chart-line mr-2"></i>AUDITS
                        </a>
                        <button id="createPlantBtn" class="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded font-black">
                            <i class="fas fa-plus mr-2"></i>NOUVELLE CENTRALE
                        </button>
                    </div>
                </div>
            </div>

            <!-- Statistiques -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-gray-900 rounded-lg p-6 border border-purple-400">
                    <div class="text-3xl font-black text-purple-400 mb-2" id="statsPlants">0</div>
                    <div class="text-sm text-gray-400">Centrales</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-6 border border-blue-400">
                    <div class="text-3xl font-black text-blue-400 mb-2" id="statsZones">0</div>
                    <div class="text-sm text-gray-400">Zones</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-6 border border-green-400">
                    <div class="text-3xl font-black text-green-400 mb-2" id="statsModules">0</div>
                    <div class="text-sm text-gray-400">Modules</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-6 border border-yellow-400">
                    <div class="text-3xl font-black text-yellow-400 mb-2" id="statsPower">0</div>
                    <div class="text-sm text-gray-400">kWc Total</div>
                </div>
            </div>

            <!-- Liste centrales -->
            <div id="plantsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Chargement -->
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-purple-400 mb-4"></i>
                    <p class="text-gray-400">Chargement centrales...</p>
                </div>
            </div>

            <!-- Message vide -->
            <div id="emptyState" class="hidden text-center py-12">
                <i class="fas fa-solar-panel text-6xl text-gray-600 mb-4"></i>
                <p class="text-gray-400 text-xl mb-6">Aucune centrale PV créée</p>
                <button onclick="showCreatePlantModal()" class="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded font-black text-lg">
                    <i class="fas fa-plus mr-2"></i>CRÉER MA PREMIÈRE CENTRALE
                </button>
            </div>
        </div>

        <!-- Modal Création Centrale -->
        <div id="createPlantModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-purple-400 rounded-lg p-6 max-w-2xl w-full">
                <h3 class="text-2xl font-black mb-4 text-purple-400">
                    <i class="fas fa-plus-circle mr-2"></i>NOUVELLE CENTRALE PV
                </h3>
                
                <form id="createPlantForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold mb-2">Nom de la centrale *</label>
                        <input type="text" id="plantName" required
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                               placeholder="Ex: Centrale Solaire Marseille">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Type d'installation *</label>
                        <select id="plantType" required
                                class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none">
                            <option value="rooftop">Toiture</option>
                            <option value="ground">Sol</option>
                            <option value="carport">Ombrière</option>
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold mb-2">Adresse</label>
                            <input type="text" id="plantAddress"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                                   placeholder="123 Rue du Soleil">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">Ville</label>
                            <input type="text" id="plantCity"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                                   placeholder="Marseille">
                        </div>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded font-black">
                            <i class="fas fa-save mr-2"></i>CRÉER CENTRALE
                        </button>
                        <button type="button" id="cancelCreateBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                            ANNULER
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script>
        // Script PV Cartography - Liste centrales
        let plants = []

        async function loadPlants() {
            try {
                const response = await fetch('/api/pv/plants')
                const data = await response.json()
                
                plants = data.plants || []
                
                updateStats()
                renderPlantsList()
            } catch (error) {
                console.error('Erreur chargement centrales:', error)
                showAlert('Erreur chargement centrales', 'error')
            }
        }

        function updateStats() {
            const totalZones = plants.reduce((sum, p) => sum + (p.zone_count || 0), 0)
            const totalModules = plants.reduce((sum, p) => sum + (p.module_count || 0), 0)
            const totalPower = plants.reduce((sum, p) => sum + (p.total_power_wp || 0), 0)
            
            document.getElementById('statsPlants').textContent = plants.length
            document.getElementById('statsZones').textContent = totalZones
            document.getElementById('statsModules').textContent = totalModules.toLocaleString()
            document.getElementById('statsPower').textContent = (totalPower / 1000).toFixed(1)
        }

        function renderPlantsList() {
            const container = document.getElementById('plantsList')
            const emptyState = document.getElementById('emptyState')
            
            if (plants.length === 0) {
                container.classList.add('hidden')
                emptyState.classList.remove('hidden')
                return
            }
            
            container.classList.remove('hidden')
            emptyState.classList.add('hidden')
            
            const typeIcons = {
                rooftop: 'fa-building',
                ground: 'fa-mountain',
                carport: 'fa-car'
            }
            
            const typeLabels = {
                rooftop: 'Toiture',
                ground: 'Sol',
                carport: 'Ombrière'
            }
            
            container.innerHTML = plants.map(plant => \`
                <div class="bg-gray-900 rounded-lg border-2 border-gray-700 hover:border-purple-400 transition-all p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-black text-purple-400 mb-1">\${plant.plant_name}</h3>
                            <p class="text-sm text-gray-400">
                                <i class="fas \${typeIcons[plant.plant_type] || 'fa-solar-panel'} mr-1"></i>
                                \${typeLabels[plant.plant_type] || plant.plant_type}
        bold text-blue-400">\${plant.zone_count || 0}</div>
                            <div class="text-xs text-gray-500">Zones</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-green-400">\${plant.module_count || 0}</div>
                            <div class="text-xs text-gray-500">Modules</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-yellow-400">\${((plant.total_power_wp || 0) / 1000).toFixed(1)}</div>
                            <div class="text-xs text-gray-500">kWc</div>
                        </div>
                    </div>
                    
                    \${plant.address || plant.city ? \`
                        <p class="text-sm text-gray-400 mb-4">
                            <i class="fas fa-map-marker-alt mr-1"></i>
                            \${plant.address || ''} \${plant.city || ''}
                        </p>
                    \` : ''}
                    
                    <div class="flex gap-2">
                        <a href="/pv/plant/\${plant.id}" 
                           class="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold text-center">
                            <i class="fas fa-eye mr-1"></i>VOIR
                        </a>
                    </div>
                </div>
            \`).join('')
        }

        function showCreatePlantModal() {
            document.getElementById('createPlantModal').classList.remove('hidden')
        }

        function hideCreatePlantModal() {
            document.getElementById('createPlantModal').classList.add('hidden')
            document.getElementById('createPlantForm').reset()
        }

        async function createPlant(formData) {
            try {
                const response = await fetch('/api/pv/plants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })
                
                const result = await response.json()
                
                if (result.success) {
                    showAlert('Centrale créée avec succès !', 'success')
                    hideCreatePlantModal()
                    loadPlants()
                } else {
                    showAlert('Erreur création centrale', 'error')
                }
            } catch (error) {
                console.error('Erreur:', error)
                showAlert('Erreur création centrale', 'error')
            }
        }

        async function deletePlant(plantId) {
            if (!confirm('Supprimer cette centrale et toutes ses données ?')) return
            
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}\`, {
                    method: 'DELETE'
                })
                
                if (response.ok) {
                    showAlert('Centrale supprimée', 'success')
                    loadPlants()
                }
            } catch (error) {
                console.error('Erreur suppression:', error)
                showAlert('Erreur suppression centrale', 'error')
            }
        }

        function showAlert(message, type = 'info') {
            const colors = {
                success: 'bg-green-600',
                error: 'bg-red-600',
                info: 'bg-blue-600'
            }
            
            const alert = document.createElement('div')
            alert.className = \`fixed top-4 right-4 \${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 font-bold\`
            alert.textContent = message
            
            document.body.appendChild(alert)
            
            setTimeout(() => alert.remove(), 3000)
        }

        // Event listeners
        document.getElementById('createPlantBtn').addEventListener('click', showCreatePlantModal)
        document.getElementById('cancelCreateBtn').addEventListener('click', hideCreatePlantModal)
        
        document.getElementById('createPlantForm').addEventListener('submit', (e) => {
            e.preventDefault()
            
            const formData = {
                plant_name: document.getElementById('plantName').value,
                plant_type: document.getElementById('plantType').value,
                address: document.getElementById('plantAddress').value || null,
                city: document.getElementById('plantCity').value || null
            }
            
            createPlant(formData)
        })

        // Init
        loadPlants()
        <\/script>
    </body>
    </html>
  `)
})
*/

// ============================================================================
// ROUTE UNIFIED INSTALLATIONS - Vue combinée EL + PV
// ============================================================================
// Redirection vers la nouvelle page unifiée
app.get('/pv/installations', (c) => {
  return c.redirect('/pv/plants')
})


// CETTE SECTION SERA INSÉRÉE DANS index.tsx LIGNE 3344

// ============================================================================
// ROUTE PV CARTOGRAPHY - Canvas Editor V2 LEAFLET PROFESSIONNEL (PHASE 2c)
// ============================================================================
app.get('/pv/plant/:plantId/zone/:zoneId/editor/v2', async (c) => {
  const plantId = c.req.param('plantId')
  const zoneId = c.req.param('zoneId')
  
  // Force browser to reload - no cache
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
  
  return c.html(getPvEditorV2Page(plantId, zoneId))
})


// ============================================================================
// ROUTE PV CARTOGRAPHY - Détail Centrale (PHASE 2a - Style DiagPV OS)
// ============================================================================
app.get('/pv/plant/:id', (c) => {
  const plantId = c.req.param('id')
  return c.html(getPvPlantDetailPage(plantId))
})

// Route Import Plan pour centrale PV
app.get('/pv/plant/:id/import-plan', (c) => {
  const plantId = c.req.param('id')
  return c.html(getPvPlanImportPage(plantId))
})

// Route Cartographie Centrale - Vue complète tous strings
app.get('/pv/plant/:id/carto', (c) => {
  const plantId = c.req.param('id')
  return c.html(getPvPlantCartoPage(plantId))
})

export default app
