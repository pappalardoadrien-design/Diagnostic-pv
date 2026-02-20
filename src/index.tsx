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
app.get('/tools', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Diagnostic Hub - Plateforme Unifiée DiagPV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
        <style>
        /* Styles critiques inline pour éviter l'écran noir - VERSION RENFORCÉE */
        * { box-sizing: border-box; }
        html, body { 
            background: #000000 !important; 
            color: #ffffff !important; 
            min-height: 100vh !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
            font-weight: bold !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.5 !important;
        }
        
        /* Container et layout */
        .container { max-width: 1200px; margin: 0 auto; padding: 24px !important; }
        .grid { display: grid !important; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
        .gap-6 { gap: 24px !important; }
        .flex { display: flex !important; }
        .items-center { align-items: center !important; }
        .justify-center { justify-content: center !important; }
        .space-x-4 > * + * { margin-left: 16px !important; }
        .mb-4 { margin-bottom: 16px !important; }
        .mb-6 { margin-bottom: 24px !important; }
        .mb-8 { margin-bottom: 32px !important; }
        .p-6 { padding: 24px !important; }
        .p-4 { padding: 16px !important; }
        .px-4 { padding-left: 16px !important; padding-right: 16px !important; }
        .py-3 { padding-top: 12px !important; padding-bottom: 12px !important; }
        .text-center { text-align: center !important; }
        
        /* Couleurs de fond */
        .bg-black { background-color: #000000 !important; }
        .bg-gray-900 { background-color: #111827 !important; }
        .bg-orange-600 { background-color: #ea580c !important; }
        .bg-green-600 { background-color: #16a34a !important; }
        .bg-blue-600 { background-color: #2563eb !important; }
        .bg-purple-600 { background-color: #9333ea !important; }
        
        /* Couleurs de texte */
        .text-white { color: #ffffff !important; }
        .text-yellow-400 { color: #facc15 !important; }
        .text-orange-400 { color: #fb923c !important; }
        .text-green-400 { color: #4ade80 !important; }
        .text-blue-400 { color: #60a5fa !important; }
        .text-gray-300 { color: #d1d5db !important; }
        .text-gray-400 { color: #9ca3af !important; }
        
        /* Bordures */
        .border { border-width: 1px !important; border-style: solid !important; }
        .border-2 { border-width: 2px !important; border-style: solid !important; }
        .border-yellow-400 { border-color: #facc15 !important; }
        .border-orange-400 { border-color: #fb923c !important; }
        .border-gray-600 { border-color: #4b5563 !important; }
        .rounded-lg { border-radius: 8px !important; }
        
        /* Tailles de police */
        .text-xl { font-size: 20px !important; }
        .text-2xl { font-size: 24px !important; }
        .text-3xl { font-size: 30px !important; }
        .text-4xl { font-size: 36px !important; }
        .font-bold { font-weight: bold !important; }
        .font-black { font-weight: 900 !important; }
        
        /* Éléments interactifs */
        button, input, select, textarea {
            padding: 12px 16px !important;
            border: 2px solid #4b5563 !important;
            border-radius: 8px !important;
            background: #000000 !important;
            color: #ffffff !important;
            font-weight: bold !important;
            font-family: inherit !important;
            cursor: pointer !important;
        }
        
        button:hover {
            opacity: 0.8 !important;
            transform: translateY(-1px) !important;
            transition: all 0.2s !important;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none !important;
            border-color: #facc15 !important;
            box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.2) !important;
        }
        
        /* Responsive */
        @media (min-width: 768px) {
            .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        
        /* Icônes FontAwesome */
        .fa, .fas { font-family: "Font Awesome 6 Free" !important; font-weight: 900 !important; }
        
        /* Classes utilitaires supplémentaires */
        .inline-flex { display: inline-flex !important; }
        .w-full { width: 100% !important; }
        .mr-2 { margin-right: 8px !important; }
        .mr-4 { margin-right: 16px !important; }
        .hidden { display: none !important; }
        
        /* Animation de chargement */
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important; }
        
        /* Styles sélection multiple */
        .module-btn.multi-select-mode {
            position: relative !important;
            transition: all 0.2s ease !important;
        }
        .module-btn.multi-select-mode:hover {
            transform: scale(1.05) !important;
            box-shadow: 0 0 10px rgba(250, 204, 21, 0.5) !important;
        }
        .module-btn.selected-for-bulk {
            border: 3px solid #facc15 !important;
            box-shadow: 0 0 15px rgba(250, 204, 21, 0.8) !important;
            transform: scale(1.02) !important;
        }
        .module-btn.selected-for-bulk::after {
            content: "OK" !important;
            position: absolute !important;
            top: -5px !important;
            right: -5px !important;
            background: #facc15 !important;
            color: #000 !important;
            width: 20px !important;
            height: 20px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 12px !important;
            font-weight: bold !important;
        }
        #multiSelectToggleBtn.active {
            background-color: #facc15 !important;
            color: #000000 !important;
            transform: scale(1.05) !important;
            box-shadow: 0 0 10px rgba(250, 204, 21, 0.6) !important;
        }
        .bulk-action-btn:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
        }
        body { background: #000 !important; color: #fff !important; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; font-weight: bold; }
        .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .bg-black { background-color: #000 !important; }
        .text-white { color: #fff !important; }
        .text-yellow-400 { color: #facc15 !important; }
        .text-orange-400 { color: #fb923c !important; }
        .text-green-400 { color: #4ade80 !important; }
        .text-blue-400 { color: #60a5fa !important; }
        .bg-gray-900 { background-color: #111827 !important; }
        .bg-orange-600 { background-color: #ea580c !important; }
        .border-yellow-400 { border-color: #facc15 !important; }
        .border-orange-400 { border-color: #fb923c !important; }
        .rounded-lg { border-radius: 8px; }
        .p-6 { padding: 24px; }
        .mb-4 { margin-bottom: 16px; }
        .font-bold { font-weight: bold; }
        .text-2xl { font-size: 24px; }
        .text-xl { font-size: 20px; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .space-x-4 > * + * { margin-left: 16px; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        @media (min-width: 768px) { .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .gap-6 { gap: 24px; }
        .border-2 { border-width: 2px; }
        .border { border-width: 1px; }
        button, input { padding: 12px 16px; border: 2px solid #4b5563; border-radius: 8px; background: #000; color: #fff; font-weight: bold; }
        button:hover { opacity: 0.8; }
        .fa, .fas { font-family: "Font Awesome 6 Free"; font-weight: 900; }
        </style>
        <meta name="theme-color" content="#000000">
        <link rel="manifest" href="/manifest.json">
        <script>
          // Enregistrement du Service Worker pour le mode PWA (Offline)
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                  console.log('✅ DiagPV "Mode Terrain" prêt (SW registered):', registration.scope);
                })
                .catch(error => {
                  console.log('❌ Erreur Service Worker:', error);
                });
            });
          }
        </script>
    </head>
    <body class="bg-black text-white min-h-screen font-bold">

        <div class="container mx-auto p-6">
            <!-- En-tête Diagnostic Hub -->
            <header class="mb-8 text-center">
                <div class="inline-flex items-center mb-4">
                    <i class="fas fa-solar-panel text-5xl text-yellow-400 mr-4"></i>
                    <div>
                        <h1 class="text-5xl font-black">DIAGNOSTIC HUB</h1>
                        <p class="text-2xl text-orange-400 mt-2">Plateforme Unifiée DiagPV</p>
                    </div>
                </div>
                <p class="text-xl text-gray-300 mt-4">Tous vos outils d'audit photovoltaïque en un seul endroit</p>
                <p class="text-lg text-blue-400 mt-2">
                    <i class="fas fa-globe mr-2"></i>
                    www.diagnosticphotovoltaique.fr
                </p>
            </header>
            
            <!-- Modules disponibles -->
            <div class="max-w-6xl mx-auto">
                <h2 class="text-3xl font-black mb-8 text-center text-yellow-400">
                    <i class="fas fa-th mr-2"></i>
                    MODULES DISPONIBLES
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <!-- Module EL - OPÉRATIONNEL -->
                    <a href="/el" class="bg-gradient-to-br from-green-900 to-green-700 rounded-lg p-8 border-4 border-green-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-green-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-moon text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE EL</h3>
                            <p class="text-lg text-green-200 mb-3">Électroluminescence</p>
                            <div class="bg-green-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-green-100">Audit nocturne EL terrain avec cartographie temps réel</p>
                        </div>
                    </a>
                    
                    <!-- Module PV CARTOGRAPHY - OPÉRATIONNEL -->
                    <a href="/pv/plants" class="bg-gradient-to-br from-purple-900 to-purple-700 rounded-lg p-8 border-4 border-purple-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-purple-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-solar-panel text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">PV CARTOGRAPHY</h3>
                            <p class="text-lg text-purple-200 mb-3">Modélisation Centrales</p>
                            <div class="bg-purple-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-purple-100">Cartographie & placement modules photovoltaïques</p>
                        </div>
                    </a>
                    
                    <!-- INSTALLATIONS UNIFIÉES - NOUVEAU -->
                    <a href="/pv/installations" class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-8 border-4 border-blue-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-blue-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-th-large text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">INSTALLATIONS</h3>
                            <p class="text-lg text-blue-200 mb-3">Vue Unifiée EL + PV</p>
                            <div class="bg-blue-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-blue-100">Gestion centralisée audits EL & centrales PV</p>
                        </div>
                    </a>
                    
                    <!-- Module I-V - OPÉRATIONNEL -->
                    <a href="/iv-curves" class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-8 border-4 border-blue-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-blue-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-chart-line text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE I-V</h3>
                            <p class="text-lg text-blue-200 mb-3">Courbes I-V</p>
                            <div class="bg-blue-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-blue-100">Mesures PVServ - Fill Factor & Résistance Série</p>
                        </div>
                    </a>
                    
                    <!-- Module Thermographie -->
                    <a href="/thermal" class="bg-gradient-to-br from-red-900 to-red-700 rounded-lg p-8 border-4 border-red-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-red-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-fire text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE THERMIQUE</h3>
                            <p class="text-lg text-red-200 mb-3">Thermographie IR</p>
                            <div class="bg-red-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-red-100">Détection points chauds et anomalies thermiques</p>
                        </div>
                    </a>
                    
                    <!-- Module Visuels - OPÉRATIONNEL -->
                    <a href="/visual" class="bg-gradient-to-br from-amber-900 to-amber-700 rounded-lg p-8 border-4 border-amber-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-amber-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-eye text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE VISUELS</h3>
                            <p class="text-lg text-amber-200 mb-3">Contrôles Visuels</p>
                            <div class="bg-amber-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-amber-100">Inspection visuelle IEC 62446-1 & défauts mécaniques</p>
                        </div>
                    </a>
                    
                    <!-- Module Isolation - OPÉRATIONNEL -->
                    <a href="/isolation" class="bg-gradient-to-br from-yellow-900 to-yellow-700 rounded-lg p-8 border-4 border-yellow-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-yellow-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-bolt text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE ISOLATION</h3>
                            <p class="text-lg text-yellow-200 mb-3">Tests d'Isolation</p>
                            <div class="bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-yellow-100">Mesures résistance isolation DC/AC & défauts électriques</p>
                        </div>
                    </a>
                    
                    <!-- Module Expertise Post-Sinistre -->
                    <div class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-8 border-4 border-gray-500 opacity-75">
                        <div class="text-center">
                            <div class="bg-gray-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-gavel text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE EXPERTISE</h3>
                            <p class="text-lg text-gray-300 mb-3">Expertise Post-Sinistre</p>
                            <div class="bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-clock mr-1"></i> PROCHAINEMENT
                            </div>
                            <p class="text-sm text-gray-300">Analyse sinistres et rapports experts judiciaires</p>
                        </div>
                    </div>
                </div>
                
                <!-- Accès rapides -->
                <div class="bg-gray-900 rounded-lg p-8 border-2 border-yellow-400">
                    <h2 class="text-2xl font-black mb-6 text-center">
                        <i class="fas fa-rocket mr-2 text-green-400"></i>
                        ACCÈS RAPIDES
                    </h2>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="bg-gray-800 rounded-lg p-6 border border-green-400 hover:bg-gray-750 transition-colors">
                            <h3 class="text-xl font-bold mb-3 text-green-400 flex items-center">
                                <i class="fas fa-plus-circle mr-2"></i>
                                NOUVEL AUDIT EL
                            </h3>
                            <p class="text-gray-300 mb-4">Créer un nouvel audit électroluminescence terrain nocturne</p>
                            <a href="/el" class="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-black text-lg transition-colors flex items-center justify-center">
                                <i class="fas fa-moon mr-2"></i>
                                CRÉER AUDIT EL
                            </a>
                        </div>
                        
                        <div class="bg-gray-800 rounded-lg p-6 border border-orange-400 hover:bg-gray-750 transition-colors">
                            <h3 class="text-xl font-bold mb-3 text-orange-400 flex items-center">
                                <i class="fas fa-tachometer-alt mr-2"></i>
                                TABLEAU DE BORD
                            </h3>
                            <p class="text-gray-300 mb-4">Gérez tous vos audits en cours avec mise à jour temps réel</p>
                            <a href="/dashboard" class="w-full bg-orange-600 hover:bg-orange-700 py-3 rounded-lg font-black text-lg transition-colors flex items-center justify-center">
                                <i class="fas fa-chart-line mr-2"></i>
                                ACCÉDER AU DASHBOARD
                            </a>
                        </div>
                        
                        <div class="bg-gray-800 rounded-lg p-6 border border-purple-400 hover:bg-gray-750 transition-colors">
                            <h3 class="text-xl font-bold mb-3 text-purple-400 flex items-center">
                                <i class="fas fa-solar-panel mr-2"></i>
                                PV CARTOGRAPHY
                            </h3>
                            <p class="text-gray-300 mb-4">Modélisez vos centrales PV avec placement précis modules</p>
                            <a href="/pv/plants" class="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-black text-lg transition-colors flex items-center justify-center">
                                <i class="fas fa-map mr-2"></i>
                                GÉRER CENTRALES PV
                            </a>
                        </div>
                        
                        <div class="bg-gray-800 rounded-lg p-6 border border-blue-400 hover:bg-gray-750 transition-colors">
                            <h3 class="text-xl font-bold mb-3 text-blue-400 flex items-center">
                                <i class="fas fa-chart-line mr-2"></i>
                                COURBES I-V
                            </h3>
                            <p class="text-gray-300 mb-4">Upload fichiers PVServ et analyse Fill Factor</p>
                            <a href="/iv-curves" class="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-black text-lg transition-colors flex items-center justify-center">
                                <i class="fas fa-bolt mr-2"></i>
                                MESURES I-V
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="mt-12 text-center text-gray-400 text-sm">
                    <p>Diagnostic Hub v1.0 - Architecture Modulaire Unifiée</p>
                    <p class="mt-2">
                        <i class="fas fa-shield-alt mr-1"></i>
                        Conformité IEC 62446-1 | IEC 61215 | NF C 15-100
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `)
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
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
        <title>DiagPV Audit EL - ${token.substring(0, 8)}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
        <style>
        /* Styles critiques inline pour éviter l'écran noir - VERSION RENFORCÉE */
        * { box-sizing: border-box; }
        html, body { 
            background: #000000 !important; 
            color: #ffffff !important; 
            min-height: 100vh !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
            font-weight: bold !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.5 !important;
        }
        
        /* Container et layout */
        .container { max-width: 1200px; margin: 0 auto; padding: 24px !important; }
        .grid { display: grid !important; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
        .gap-6 { gap: 24px !important; }
        .flex { display: flex !important; }
        .items-center { align-items: center !important; }
        .justify-center { justify-content: center !important; }
        .space-x-4 > * + * { margin-left: 16px !important; }
        .mb-4 { margin-bottom: 16px !important; }
        .mb-6 { margin-bottom: 24px !important; }
        .mb-8 { margin-bottom: 32px !important; }
        .p-6 { padding: 24px !important; }
        .p-4 { padding: 16px !important; }
        .px-4 { padding-left: 16px !important; padding-right: 16px !important; }
        .py-3 { padding-top: 12px !important; padding-bottom: 12px !important; }
        .text-center { text-align: center !important; }
        
        /* Couleurs de fond */
        .bg-black { background-color: #000000 !important; }
        .bg-gray-900 { background-color: #111827 !important; }
        .bg-orange-600 { background-color: #ea580c !important; }
        .bg-green-600 { background-color: #16a34a !important; }
        .bg-blue-600 { background-color: #2563eb !important; }
        .bg-purple-600 { background-color: #9333ea !important; }
        
        /* Couleurs de texte */
        .text-white { color: #ffffff !important; }
        .text-yellow-400 { color: #facc15 !important; }
        .text-orange-400 { color: #fb923c !important; }
        .text-green-400 { color: #4ade80 !important; }
        .text-blue-400 { color: #60a5fa !important; }
        .text-gray-300 { color: #d1d5db !important; }
        .text-gray-400 { color: #9ca3af !important; }
        
        /* Bordures */
        .border { border-width: 1px !important; border-style: solid !important; }
        .border-2 { border-width: 2px !important; border-style: solid !important; }
        .border-yellow-400 { border-color: #facc15 !important; }
        .border-orange-400 { border-color: #fb923c !important; }
        .border-gray-600 { border-color: #4b5563 !important; }
        .rounded-lg { border-radius: 8px !important; }
        
        /* Tailles de police */
        .text-xl { font-size: 20px !important; }
        .text-2xl { font-size: 24px !important; }
        .text-3xl { font-size: 30px !important; }
        .text-4xl { font-size: 36px !important; }
        .font-bold { font-weight: bold !important; }
        .font-black { font-weight: 900 !important; }
        
        /* Éléments interactifs */
        button, input, select, textarea {
            padding: 12px 16px !important;
            border: 2px solid #4b5563 !important;
            border-radius: 8px !important;
            background: #000000 !important;
            color: #ffffff !important;
            font-weight: bold !important;
            font-family: inherit !important;
            cursor: pointer !important;
        }
        
        button:hover {
            opacity: 0.8 !important;
            transform: translateY(-1px) !important;
            transition: all 0.2s !important;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none !important;
            border-color: #facc15 !important;
            box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.2) !important;
        }
        
        /* Responsive */
        @media (min-width: 768px) {
            .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        
        /* Icônes FontAwesome */
        .fa, .fas { font-family: "Font Awesome 6 Free" !important; font-weight: 900 !important; }
        
        /* Classes utilitaires supplémentaires */
        .inline-flex { display: inline-flex !important; }
        .w-full { width: 100% !important; }
        .mr-2 { margin-right: 8px !important; }
        .mr-4 { margin-right: 16px !important; }
        .hidden { display: none !important; }
        
        /* Animation de chargement */
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important; }
        
        /* Styles sélection multiple */
        .module-btn.multi-select-mode {
            position: relative !important;
            transition: all 0.2s ease !important;
        }
        .module-btn.multi-select-mode:hover {
            transform: scale(1.05) !important;
            box-shadow: 0 0 10px rgba(250, 204, 21, 0.5) !important;
        }
        .module-btn.selected-for-bulk {
            border: 3px solid #facc15 !important;
            box-shadow: 0 0 15px rgba(250, 204, 21, 0.8) !important;
            transform: scale(1.02) !important;
        }
        .module-btn.selected-for-bulk::after {
            content: "OK" !important;
            position: absolute !important;
            top: -5px !important;
            right: -5px !important;
            background: #facc15 !important;
            color: #000 !important;
            width: 20px !important;
            height: 20px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 12px !important;
            font-weight: bold !important;
        }
        #multiSelectToggleBtn.active {
            background-color: #facc15 !important;
            color: #000000 !important;
            transform: scale(1.05) !important;
            box-shadow: 0 0 10px rgba(250, 204, 21, 0.6) !important;
        }
        .bulk-action-btn:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
        }
        body { background: #000 !important; color: #fff !important; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; font-weight: bold; }
        .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .bg-black { background-color: #000 !important; }
        .text-white { color: #fff !important; }
        .text-yellow-400 { color: #facc15 !important; }
        .text-orange-400 { color: #fb923c !important; }
        .text-green-400 { color: #4ade80 !important; }
        .text-blue-400 { color: #60a5fa !important; }
        .bg-gray-900 { background-color: #111827 !important; }
        .bg-orange-600 { background-color: #ea580c !important; }
        .border-yellow-400 { border-color: #facc15 !important; }
        .border-orange-400 { border-color: #fb923c !important; }
        .rounded-lg { border-radius: 8px; }
        .p-6 { padding: 24px; }
        .mb-4 { margin-bottom: 16px; }
        .font-bold { font-weight: bold; }
        .text-2xl { font-size: 24px; }
        .text-xl { font-size: 20px; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .space-x-4 > * + * { margin-left: 16px; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        @media (min-width: 768px) { .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .gap-6 { gap: 24px; }
        .border-2 { border-width: 2px; }
        .border { border-width: 1px; }
        button, input { padding: 12px 16px; border: 2px solid #4b5563; border-radius: 8px; background: #000; color: #fff; font-weight: bold; }
        button:hover { opacity: 0.8; }
        .fa, .fas { font-family: "Font Awesome 6 Free"; font-weight: 900; }
        </style>
        <meta name="theme-color" content="#000000">
    </head>
    <body class="bg-black text-white min-h-screen font-bold overflow-x-auto" data-audit-token="${token}">
        <!-- En-tête audit -->
        <header class="sticky top-0 bg-black border-b-2 border-yellow-400 p-4 z-50">
            <div class="flex flex-wrap items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-yellow-400 hover:text-yellow-300" title="Retour à l'accueil">
                        <i class="fas fa-home text-2xl"></i>
                    </a>
                    <i class="fas fa-moon text-2xl text-yellow-400"></i>
                    <div>
                        <div class="flex items-center space-x-2">
                            <h1 id="projectTitle" class="text-xl font-black">Chargement...</h1>
                            <button id="editAuditBtn" class="text-orange-400 hover:text-orange-300 p-1" title="Modifier l'audit">
                                <i class="fas fa-edit text-lg"></i>
                            </button>
                        </div>
                        <div class="flex items-center space-x-4 text-sm">
                            <span>Progression: <span id="progress" class="text-green-400 font-black">0/0</span></span>
                            <span>Techniciens: <span id="technicians" class="text-blue-400">0/4</span></span>
                            <span id="technicianIcons"></span>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-2 flex-wrap">
                    <a href="/dashboard" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold flex items-center border-2 border-orange-400 shadow-lg" title="Accéder au tableau de bord - Vue d'ensemble audits">
                        <i class="fas fa-tachometer-alt mr-2 text-lg"></i>TABLEAU DE BORD
                    </a>
                    <a href="/audit/${token}/photos" class="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded font-bold flex items-center border-2 border-pink-400 shadow-lg" title="Upload et analyse IA des photos EL">
                        <i class="fas fa-camera mr-2 text-lg"></i>PHOTOS EL
                    </a>
                    <button id="pvCartoBtn" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold flex items-center" style="display:none;" title="Cartographie PV de cette centrale">
                        <i class="fas fa-solar-panel mr-1"></i>PV CARTO
                    </button>
                    <a href="/pv/plants" class="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded font-bold flex items-center" title="Liste toutes centrales PV">
                        <i class="fas fa-list mr-1"></i>CENTRALES
                    </a>
                    <button id="multiSelectToggleBtn" class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-bold border-2 border-yellow-400" title="Activer la sélection multiple pour gagner du temps sur les modules défectueux">
                        <i class="fas fa-check-square mr-1"></i>SÉLECTION MULTIPLE
                    </button>
                    <button id="configBtn" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold" title="Modifier configuration technique (strings, BJ, onduleurs)">
                        <i class="fas fa-cog mr-1"></i>CONFIG
                    </button>
                    <button id="measureBtn" class="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-chart-line mr-1"></i>MESURES
                    </button>
                    <button id="reportBtn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-file-pdf mr-1"></i>RAPPORT
                    </button>
                    <button id="shareBtn" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-share mr-1"></i>PARTAGE
                    </button>
                </div>
            </div>
        </header>
        
        <!-- Navigation strings -->
        <nav class="bg-gray-900 p-4 border-b border-gray-600 overflow-x-auto">
            <div id="stringNavigation" class="flex space-x-2 min-w-max">
                <!-- Navigation dynamique des strings -->
            </div>
        </nav>
        
        <!-- Zone principale audit -->
        <main class="p-4">
            <!-- Barre d'outils sélection multiple -->
            <div id="multiSelectToolbar" class="hidden bg-orange-900 border-2 border-orange-400 rounded-lg p-4 mb-4 sticky top-20 z-40">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center space-x-4">
                        <button id="exitMultiSelectBtn" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold text-sm" title="Quitter le mode sélection">
                            <i class="fas fa-times mr-1"></i>QUITTER
                        </button>
                        <button id="selectAllBtn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold text-sm" title="Sélectionner tous les modules visibles">
                            <i class="fas fa-check-double mr-1"></i>TOUT
                        </button>
                        <button id="clearSelectionBtn" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-bold text-sm" title="Désélectionner tout">
                            <i class="fas fa-times-circle mr-1"></i>AUCUN
                        </button>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        <span class="text-sm">Sélectionnés:</span>
                        <span id="selectedCount" class="bg-black px-3 py-1 rounded font-black text-yellow-400">0</span>
                    </div>
                </div>
                
                <!-- Actions de lot -->
                <div class="mt-4 pt-4 border-t border-orange-400">
                    <div class="grid grid-cols-2 md:grid-cols-6 gap-2">
                        <button class="bulk-action-btn bg-green-600 hover:bg-green-700 p-2 rounded font-bold text-sm" data-status="ok" title="Marquer comme OK">
                            OK
                        </button>
                        <button class="bulk-action-btn bg-yellow-600 hover:bg-yellow-700 p-2 rounded font-bold text-sm" data-status="inequality" title="Marquer comme inégalité">
                            Inegalite
                        </button>
                        <button class="bulk-action-btn bg-orange-600 hover:bg-orange-700 p-2 rounded font-bold text-sm" data-status="microcracks" title="Marquer comme microfissures">
                            Fissures
                        </button>
                        <button class="bulk-action-btn bg-red-600 hover:bg-red-700 p-2 rounded font-bold text-sm" data-status="dead" title="Marquer comme HS">
                            Impact Cellulaire
                        </button>
                        <button class="bulk-action-btn bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold text-sm" data-status="string_open" title="Marquer comme string ouvert">
                            String
                        </button>
                        <button class="bulk-action-btn bg-gray-600 hover:bg-gray-700 p-2 rounded font-bold text-sm" data-status="not_connected" title="Marquer comme non raccordé">
                            Non raccorde
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="auditContent">
                <!-- Contenu dynamique de l'audit -->
            </div>
        </main>
        
        <!-- Modal diagnostic module -->
        <div id="moduleModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-md w-full">
                <h3 id="modalTitle" class="text-xl font-black mb-4 text-center">MODULE M000</h3>
                
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <button class="module-status-btn bg-green-600 hover:bg-green-700 p-3 rounded font-bold" data-status="ok">
                        ✅ OK<br><span class="text-sm font-normal">Aucun défaut détecté</span>
                    </button>
                    <button class="module-status-btn bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold" data-status="inequality">
                        ⚠️ Inégalité<br><span class="text-sm font-normal">Qualité cellules</span>
                    </button>
                    <button class="module-status-btn bg-orange-600 hover:bg-orange-700 p-3 rounded font-bold" data-status="microcracks">
                        🔶 Microfissures<br><span class="text-sm font-normal">Visibles EL</span>
                    </button>
                    <button class="module-status-btn bg-red-600 hover:bg-red-700 p-3 rounded font-bold" data-status="dead">
                        ❌ HS Impact Cell.<br><span class="text-sm font-normal">Défaut cellulaire majeur</span>
                    </button>
                    <button class="module-status-btn bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold" data-status="string_open">
                        🔗 String ouvert<br><span class="text-sm font-normal">Sous-string ouvert</span>
                    </button>
                    <button class="module-status-btn bg-purple-600 hover:bg-purple-700 p-3 rounded font-bold" data-status="not_connected">
                        🚫 Non raccordé<br><span class="text-sm font-normal">Non connecté</span>
                    </button>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-bold mb-2">Commentaire (optionnel) :</label>
                    <div class="relative">
                        <input type="text" id="moduleComment" 
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 pr-12 text-lg focus:border-yellow-400 focus:outline-none"
                               placeholder="Détails du défaut...">
                    </div>
                </div>
                
                <div class="flex space-x-3 relative">
                    <button id="validateBtn" class="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-black">
                        VALIDER
                    </button>
                    <!-- Bouton microphone -->
                    <button type="button" id="voiceBtn" class="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full font-black flex items-center justify-center shadow-lg border-2 border-blue-400" title="Dictée vocale">
                        <i class="fas fa-microphone text-xl"></i>
                    </button>
                    <button id="cancelBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
                </div>
                
                <!-- Indicateur d'enregistrement vocal -->
                <div id="voiceIndicator" class="hidden mt-3 text-center">
                    <div class="inline-flex items-center space-x-2 bg-red-600 px-4 py-2 rounded-full animate-pulse">
                        <i class="fas fa-circle text-xs"></i>
                        <span class="font-bold">Écoute en cours...</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal édition audit -->
        <div id="editAuditModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-orange-400 rounded-lg p-6 max-w-lg w-full">
                <h3 class="text-xl font-black mb-4 text-center text-orange-400">
                    <i class="fas fa-edit mr-2"></i>MODIFIER L'AUDIT
                </h3>
                
                <form id="editAuditForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold mb-2">Nom du projet :</label>
                        <input type="text" id="editProjectName" required 
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-orange-400 focus:outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Client :</label>
                        <input type="text" id="editClientName" required 
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-orange-400 focus:outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Localisation :</label>
                        <input type="text" id="editLocation" required 
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-orange-400 focus:outline-none">
                    </div>
                    
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="flex-1 bg-orange-600 hover:bg-orange-700 py-3 rounded font-black">
                            <i class="fas fa-save mr-2"></i>SAUVEGARDER
                        </button>
                        <button type="button" id="cancelEditBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                            ANNULER
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal configuration technique -->
        <div id="configModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-purple-400 rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
                <h3 class="text-xl font-black mb-4 text-center text-purple-400">
                    <i class="fas fa-cog mr-2"></i>CONFIGURATION TECHNIQUE
                </h3>
                
                <div class="bg-yellow-900 border border-yellow-400 rounded p-3 mb-4">
                    <p class="text-sm text-yellow-200">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <strong>ATTENTION :</strong> Modifier la configuration en cours d'audit peut affecter vos données.
                        Soyez sûr des valeurs entrées.
                    </p>
                </div>
                
                <form id="configForm" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold mb-2">Nombre de strings :</label>
                            <input type="number" id="configStringCount" min="1" max="50"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-purple-400 focus:outline-none">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold mb-2">Puissance panneau (Wc) :</label>
                            <input type="number" id="configPanelPower" min="100" max="1000"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-purple-400 focus:outline-none">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold mb-2">Boîtes de jonction (BJ) :</label>
                            <input type="number" id="configJunctionBoxes" min="0" max="100"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-purple-400 focus:outline-none">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold mb-2">Nombre d'onduleurs :</label>
                            <input type="number" id="configInverterCount" min="1" max="50"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-purple-400 focus:outline-none">
                        </div>
                    </div>
                    
                    <div class="border-t-2 border-gray-700 pt-4 mt-4">
                        <h4 class="text-lg font-black mb-3 text-purple-400">
                            <i class="fas fa-plus-circle mr-2"></i>AJOUTER UN STRING
                        </h4>
                        
                        <div class="bg-gray-800 rounded p-4 space-y-3">
                            <div class="grid grid-cols-3 gap-3">
                                <div>
                                    <label class="block text-xs font-bold mb-1">N° String :</label>
                                    <input type="number" id="addStringNumber" min="1" max="50" placeholder="Ex: 11"
                                           class="w-full bg-black border-2 border-gray-600 rounded px-2 py-2 text-lg focus:border-purple-400 focus:outline-none">
                                </div>
                                
                                <div>
                                    <label class="block text-xs font-bold mb-1">Nb modules :</label>
                                    <input type="number" id="addStringModuleCount" min="1" max="100" placeholder="Ex: 24"
                                           class="w-full bg-black border-2 border-gray-600 rounded px-2 py-2 text-lg focus:border-purple-400 focus:outline-none">
                                </div>
                                
                                <div>
                                    <label class="block text-xs font-bold mb-1">Début :</label>
                                    <input type="number" id="addStringStartPos" min="1" max="100" value="1"
                                           class="w-full bg-black border-2 border-gray-600 rounded px-2 py-2 text-lg focus:border-purple-400 focus:outline-none">
                                </div>
                            </div>
                            
                            <button type="button" id="addStringBtn" class="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold">
                                <i class="fas fa-plus mr-2"></i>AJOUTER CE STRING
                            </button>
                            
                            <div id="addedStringsList" class="text-sm text-green-400 hidden">
                                <!-- Liste des strings ajoutés -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded font-black">
                            <i class="fas fa-save mr-2"></i>SAUVEGARDER CONFIGURATION
                        </button>
                        <button type="button" id="cancelConfigBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                            ANNULER
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal confirmation sélection multiple -->
        <div id="bulkActionModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-lg w-full">
                <h3 class="text-xl font-black mb-4 text-center text-yellow-400">
                    <i class="fas fa-exclamation-triangle mr-2"></i>CONFIRMATION SÉLECTION MULTIPLE
                </h3>
                
                <div class="bg-gray-800 border border-orange-400 rounded p-4 mb-4">
                    <p class="text-center mb-2">Vous allez modifier <span id="bulkCount" class="text-yellow-400 font-black">0</span> modules :</p>
                    <div id="bulkModulesList" class="text-sm text-gray-300 max-h-32 overflow-y-auto">
                        <!-- Liste des modules sélectionnés -->
                    </div>
                </div>
                
                <div class="bg-gray-800 border border-green-400 rounded p-4 mb-4">
                    <p class="text-center">
                        Nouveau statut : <span id="bulkNewStatus" class="font-black text-green-400">OK</span>
                    </p>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-bold mb-2">Commentaire pour tous (optionnel) :</label>
                    <input type="text" id="bulkComment" 
                           class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-yellow-400 focus:outline-none"
                           placeholder="Ex: Modules cassés lors passage EL...">
                </div>
                
                <div class="flex space-x-3">
                    <button id="confirmBulkBtn" class="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-black">
                        <i class="fas fa-check mr-2"></i>CONFIRMER
                    </button>
                    <button id="cancelBulkBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
                </div>
            </div>
        </div>
        
        <script src="/static/diagpv-audit.js?v=20251104-2"></script>
        <script src="/static/diagpv-measures.js?v=20251104-2"></script>
        <script>
        // ============================================================================
        // Interconnexion Module EL  PV Carto
        // ============================================================================
        const AUDIT_TOKEN = '${token}'
        
        async function loadPlantLink() {
            const btn = document.getElementById('pvCartoBtn')
            if (!btn) return
            
            try {
                const response = await fetch(\`/api/interconnect/audit/\${AUDIT_TOKEN}/plant\`)
                const data = await response.json()
                
                if (data.linked && data.plant) {
                    btn.style.display = 'flex'
                    btn.onclick = () => {
                        window.location.href = \`/pv/plant/\${data.plant.plant_id}\`
                    }
                    btn.title = \`Cartographie PV: \${data.plant.plant_name || 'Centrale liée'}\`
                    console.log("✅ Centrale PV liée:", data.plant.plant_name)
                } else {
                    btn.style.display = 'flex'
                    btn.onclick = () => {
                        window.location.href = \`/api/pv/el-audit/\${AUDIT_TOKEN}/quick-map\`
                    }
                    btn.title = "Créer cartographie PV depuis cet audit EL"
                    console.log("ℹ️ Bouton Quick-Map activé")
                }
            } catch (error) {
                btn.style.display = 'flex'
                btn.onclick = () => {
                    window.location.href = \`/api/pv/el-audit/\${AUDIT_TOKEN}/quick-map\`
                }
                btn.title = "Créer cartographie PV depuis cet audit EL"
                console.log("ℹ️ Bouton Quick-Map activé (fallback)")
            }
        }
        
        // Charger lien après initialisation
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(loadPlantLink, 500)
        })
        <\/script>
    </body>
    </html>
  `)
})

// Fonction génération grille modules physique
function generatePhysicalModulesGrid(modules: any[]) {
  if (!modules || modules.length === 0) {
    return '<p>Aucun module trouvé</p>'
  }

  // Tri des modules par position physique
  const sortedModules = modules.sort((a, b) => {
    // Tri par rangée (row) d'abord, puis par colonne (col)
    if (a.physical_row !== b.physical_row) {
      return (a.physical_row || 0) - (b.physical_row || 0)
    }
    return (a.physical_col || 0) - (b.physical_col || 0)
  })

  // Déterminer dimensions de la grille
  const maxRow = Math.max(...sortedModules.map(m => m.physical_row || 0))
  const maxCol = Math.max(...sortedModules.map(m => m.physical_col || 0))
  const minRow = Math.min(...sortedModules.map(m => m.physical_row || 0))
  const minCol = Math.min(...sortedModules.map(m => m.physical_col || 0))

  // Créer une grille vide (String 1 en HAUT = index 0)
  const grid = []
  for (let row = minRow; row <= maxRow; row++) { // Row 1  index 0 (TOP), Row 10  index 9 (BOTTOM)
    const gridRow = []
    for (let col = minCol; col <= maxCol; col++) {
      gridRow.push(null)
    }
    grid.push(gridRow)
  }

  // Placer les modules dans la grille
  sortedModules.forEach(module => {
    const row = module.physical_row || 0
    const col = module.physical_col || 0
    const gridRowIndex = row - minRow  // Row 1  index 0 (TOP), Row 10  index 9 (BOTTOM)
    const gridColIndex = col - minCol
    
    if (grid[gridRowIndex] && grid[gridRowIndex][gridColIndex] !== undefined) {
      grid[gridRowIndex][gridColIndex] = module
    }
  })

  // Génération HTML de la grille
  let html = `
    <div class="physical-modules-grid" style="
      display: grid; 
      grid-template-columns: repeat(${maxCol - minCol + 1}, 32px);
      gap: 3px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 10px;
      border: 2px dashed #cbd5e1;
      justify-content: center;
      max-width: fit-content;
      margin: 0 auto;
    ">
  `

  grid.forEach((row, rowIndex) => {
    row.forEach((module, colIndex) => {
      if (module) {
        html += `
          <div class="module ${module.status}" title="${module.module_id} (Rang ${module.physical_row}, Col ${module.physical_col})">
            ${module.module_id.includes('-') ? module.module_id.split('-')[1] : module.module_id.substring(1)}
          </div>
        `
      } else {
        // Cellule vide pour maintenir l'alignement
        html += `<div class="module-empty" style="width: 30px; height: 24px;"></div>`
      }
    })
  })

  html += '</div>'
  
  // Ajouter une vue par string aussi pour référence
  html += '<div style="margin-top: 30px;">'
  html += '<h4 style="color: #374151; margin-bottom: 15px;">DOCS Vue par String (référence)</h4>'
  
  // Grouper par string
  const modulesByString = {}
  sortedModules.forEach(module => {
    const stringNum = module.string_number
    if (!modulesByString[stringNum]) {
      modulesByString[stringNum] = []
    }
    modulesByString[stringNum].push(module)
  })

  Object.keys(modulesByString).sort((a, b) => parseInt(a) - parseInt(b)).forEach(stringNum => {
    const stringModules = modulesByString[stringNum].sort((a, b) => a.position_in_string - b.position_in_string)
    
    html += `
      <div style="margin-bottom: 15px;">
        <div style="font-weight: 600; margin-bottom: 5px; color: #1f2937;">
          String ${stringNum} (${stringModules.length} modules)
        </div>
        <div style="display: flex; gap: 3px; flex-wrap: wrap;">
    `
    
    stringModules.forEach(module => {
      html += `
        <div class="module ${module.status}" style="width: 28px; height: 20px; font-size: 8px;" 
             title="${module.module_id}">
          ${module.position_in_string}
        </div>
      `
    })
    
    html += '</div></div>'
  })
  
  html += '</div>'
  
  return html
}

// Fonction génération HTML rapport
async function generateReportHTML(audit: any, modules: any[], stats: any, measurements: any[] = []) {
  const date = new Date().toLocaleDateString('fr-FR')
  const okPercentage = ((stats.ok / stats.total) * 100).toFixed(1)
  const inequalityPercentage = ((stats.inequality / stats.total) * 100).toFixed(1)
  const microcracksPercentage = ((stats.microcracks / stats.total) * 100).toFixed(1)
  const deadPercentage = ((stats.dead / stats.total) * 100).toFixed(1)
  const stringOpenPercentage = ((stats.string_open / stats.total) * 100).toFixed(1)
  const notConnectedPercentage = ((stats.not_connected / stats.total) * 100).toFixed(1)

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Rapport Audit EL - ${audit.project_name}</title>
        <style>
            /* === DESIGN PROFESSIONNEL DIAGPV === */
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                margin: 0; 
                padding: 20px;
                color: #1f2937; 
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                line-height: 1.6;
            }
            
            .header { 
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                color: white;
                text-align: center; 
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                margin-bottom: 30px;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="0.5" fill="%23ffffff" opacity="0.03"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grain)"/></svg>');
                pointer-events: none;
            }
            
            .header h1 {
                font-size: 2.5rem;
                font-weight: 700;
                margin: 0 0 10px 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                letter-spacing: -0.5px;
            }
            
            .header p {
                font-size: 1.1rem;
                opacity: 0.9;
                margin: 5px 0;
                font-weight: 400;
            }
            
            .header h2 {
                color: #f59e0b;
                font-size: 1.5rem;
                font-weight: 600;
                margin: 20px 0 30px 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .client-info {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 25px;
                text-align: left;
                margin-top: 25px;
                border: 1px solid rgba(255,255,255,0.2);
            }
            
            .client-info p {
                margin: 8px 0;
                display: flex;
                align-items: center;
                font-size: 0.95rem;
            }
            
            .client-info strong {
                min-width: 140px;
                color: #f59e0b;
                font-weight: 600;
            }
            
            .section { 
                background: white;
                margin: 25px 0;
                page-break-inside: avoid;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                overflow: hidden;
                border: 1px solid #e5e7eb;
            }
            
            .section h3 {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                margin: 0;
                padding: 20px 25px;
                font-size: 1.25rem;
             page-break-inside: avoid;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                overflow: hidden;
                border: 1px solid #e5e7eb;
            }
            
            .section h3 {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                margin: 0;
                padding: 20px 25px;
                font-size: 1.25rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
            }
            
            .section-content {
                padding: 25px;
            }
            
            .stats { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
                gap: 15px;
                margin: 20px 0;
            }
            
            .stat-card {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 10px;
                padding: 20px;
                border-left: 4px solid;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                transition: transform 0.2s ease;
            }
            
            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .stat-ok { border-left-color: #22c55e; }
            .stat-inequality { border-left-color: #eab308; }
            .stat-microcracks { border-left-color: #f97316; }
            .stat-dead { border-left-color: #ef4444; }
            .stat-string_open { border-left-color: #3b82f6; }
            .stat-not_connected { border-left-color: #6b7280; }
            
            .total-summary {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                font-size: 1.1rem;
                font-weight: 600;
                margin: 20px 0;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .module-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fill, 32px); 
                gap: 3px;
                padding: 20px;
                background: #f8fafc;
                border-radius: 10px;
                border: 2px dashed #cbd5e1;
            }
            
            .module { 
                width: 30px; 
                height: 24px; 
                border-radius: 4px;
                text-align: center; 
                font-size: 9px; 
                color: white; 
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                transition: transform 0.1s ease;
            }
            
            .module:hover {
                transform: scale(1.1);
                z-index: 10;
                position: relative;
            }
            
            .ok { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important; }
            .inequality { background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%) !important; }
            .microcracks { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important; }
            .dead { 
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important; 
                animation: pulse-danger 2s infinite;
            }
            .string_open { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important; }
            .not_connected { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important; }
            .pending { 
                background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%) !important; 
                color: #4b5563 !important;
                border: 1px dashed #9ca3af;
            }
            
            @keyframes pulse-danger {
                0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
            }
            
            .legend {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin: 20px 0;
                padding: 20px;
                background: white;
                border-radius: 10px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
                font-weight: 500;
                color: #4b5563;
            }
            
            .legend-color {
                width: 20px;
                height: 16px;
                border-radius: 3px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 0.9rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                border-radius: 8px;
                overflow: hidden;
            }
            
            table th {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white;
                padding: 15px 12px;
                text-align: left;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 0.8rem;
            }
            
            table td {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
                background: white;
            }
            
            table tr:nth-child(even) td {
                background: #f8fafc;
            }
            
            table tr:hover td {
                background: #e0f2fe;
            }
            
            .signature-section {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border: 2px solid #cbd5e1;
                border-radius: 12px;
                padding: 25px;
                text-align: center;
                margin-top: 30px;
            }
            
            .instructions-box {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border: 2px solid #f59e0b;
                border-radius: 12px;
                padding: 20px;
                margin: 25px 0;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            
            .instructions-box h4 {
                color: #92400e;
                margin: 0 0 15px 0;
                font-size: 1.1rem;
                font-weight: 600;
            }
            
            .instructions-box p {
                color: #92400e;
                margin: 8px 0;
                font-size: 0.9rem;
            }
            
            /* Styles spécifiques pour impression */
            @media print {
                body { 
                    margin: 15px; 
                    font-size: 12px;
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                .module { 
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .ok { background-color: #22c55e !important; -webkit-print-color-adjust: exact !important; }
                .inequality { background-color: #eab308 !important; -webkit-print-color-adjust: exact !important; }
                .microcracks { background-color: #f97316 !important; -webkit-print-color-adjust: exact !important; }
                .dead { background-color: #ef4444 !important; -webkit-print-color-adjust: exact !important; }
                .string_open { background-color: #3b82f6 !important; -webkit-print-color-adjust: exact !important; }
                .not_connected { background-color: #6b7280 !important; -webkit-print-color-adjust: exact !important; }
                .pending { background-color: #e5e7eb !important; -webkit-print-color-adjust: exact !important; }
                
                /* Forcer les couleurs même en mode économie d'encre */
                * { 
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            }
            
            /* Styles pour PDF */
            @page {
                size: A4;
                margin: 1cm;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Batiment DIAGNOSTIC PHOTOVOLTAÏQUE</h1>
            <p>www.diagnosticphotovoltaique.fr</p>
            <h2>ELEC AUDIT ÉLECTROLUMINESCENCE ELEC</h2>
            
            <div class="client-info">
                <p><strong>Client :</strong> ${audit.client_name}</p>
                <p><strong>Installation :</strong> ${audit.location}</p>
                <p><strong>Date intervention :</strong> ${date}</p>
                <p><strong>Configuration :</strong> ${audit.total_modules} modules photovoltaïques, ${audit.string_count} strings</p>
                <p><strong>Méthode :</strong> Électroluminescence nocturne</p>
                <p><strong>Normes :</strong> IEC 62446-1, IEC 61215</p>
            </div>
        </div>
        
        <div class="section">
            <h3>STATS RÉSULTATS AUDIT ÉLECTROLUMINESCENCE</h3>
            <div class="section-content">
                <div class="stats">
                    <div class="stat-card stat-ok">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">OK</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Modules OK</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #22c55e;">${stats.ok} (${okPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-inequality">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">Inegalite</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Inégalité cellules</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #eab308;">${stats.inequality} (${inequalityPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-microcracks">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">Fissures</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Microfissures</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #f97316;">${stats.microcracks} (${microcracksPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-dead">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">HS</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Modules HS</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${stats.dead} (${deadPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-string_open">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">String</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Strings ouverts</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${stats.string_open} (${stringOpenPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-not_connected">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">Non-connecte</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Non raccordés</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #6b7280;">${stats.not_connected} (${notConnectedPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="total-summary">
                    ELEC TOTAL MODULES AUDITÉS : ${stats.total} ELEC
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>CARTE CARTOGRAPHIE MODULES</h3>
            <div class="section-content">
                
                <!-- Légende des couleurs -->
                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-color ok"></div>
                        <span>OK</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color inequality"></div>
                        <span>Inégalité</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color microcracks"></div>
                        <span>Microfissures</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color dead"></div>
                        <span>HS</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color string_open"></div>
                        <span>String ouvert</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color not_connected"></div>
                        <span>Non raccordé</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color pending"></div>
                        <span>En attente</span>
                    </div>
                </div>
                
                ${generatePhysicalModulesGrid(modules)}
                
            </div>
        </div>
        
        <div class="section">
            <h3>ATTENTION MODULES NON-CONFORMES</h3>
            <div class="section-content">
                <table>
                    <tr>
                        <th>N° Module</th>
                        <th>String</th>
                        <th>État</th>
                        <th>Commentaire</th>
                    </tr>
                ${modules
                  .filter(m => m.status !== 'ok' && m.status !== 'pending')
                  .map(module => `
                    <tr>
                        <td>${module.module_id}</td>
                        <td>S${module.string_number}</td>
                        <td>${getStatusLabel(module.status)}</td>
                        <td>${module.comment || '-'}</td>
                    </tr>
                  `).join('')}
                </table>
            </div>
        </div>
        
        ${measurements.length > 0 ? `
        <div class="section">
            <h3>ELEC MESURES ÉLECTRIQUES PVSERV</h3>
            <div class="section-content">
                <div class="stats">
                    <div class="stat-card">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">STATS</div>
                            <div style="font-weight: 600;">Total mesures</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${measurements.length}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">ELEC</div>
                            <div style="font-weight: 600;">FF moyen</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #22c55e;">${(measurements.reduce((sum, m) => sum + parseFloat(m.ff || 0), 0) / measurements.length).toFixed(3)}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">CONNECT</div>
                            <div style="font-weight: 600;">Rds moyen</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${(measurements.reduce((sum, m) => sum + parseFloat(m.rds || 0), 0) / measurements.length).toFixed(2)} Ω</div>
                        </div>
                    </div>
                </div>
                
                <table>
                    <tr>
                        <th>Module</th>
                        <th>Type</th>
                        <th>FF</th>
                        <th>Rds (Ω)</th>
                        <th>Uf (V)</th>
                        <th>Points IV</th>
                    </tr>
                ${measurements.slice(0, 50).map(m => { // Limite 50 pour PDF
                  const ivData = JSON.parse(m.iv_curve_data || '{"count": 0}')
                  return `
                    <tr>
                        <td>M${m.module_number?.toString().padStart(3, '0')}</td>
                        <td>${m.measurement_type}</td>
                        <td>${parseFloat(m.ff || 0).toFixed(3)}</td>
                        <td>${parseFloat(m.rds || 0).toFixed(2)}</td>
                        <td>${m.uf || 0}</td>
                        <td>${ivData.count || 0}</td>
                    </tr>
                  `
                }).join('')}
                ${measurements.length > 50 ? `
                <tr>
                    <td colspan="6" style="text-align: center; font-style: italic; color: #6b7280;">
                        ... ${measurements.length - 50} mesures supplémentaires disponibles dans l'export complet
                    </td>
                </tr>
                ` : ''}
                </table>
                
                <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; font-size: 0.9rem; color: #4b5563;"><strong>Note:</strong> Données PVserv brutes sans interprétation. FF = Fill Factor, Rds = Résistance série, Uf = Tension.</p>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="signature-section">
            <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 1.25rem;"> SIGNATURE NUMÉRIQUE</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; text-align: left; font-size: 0.9rem; color: #4b5563;">
                <div><strong>Génération :</strong> Automatique DiagPV Audit</div>
                <div><strong>Date :</strong> ${date}</div>
                <div><strong>Token :</strong> ${audit.token}</div>
                ${measurements.length > 0 ? `<div><strong>Mesures PVserv :</strong> ${measurements.length} intégrées</div>` : ''}
            </div>
        </div>
        
        <div class="instructions-box">
            <h4>DOCS INSTRUCTIONS IMPRESSION COULEURS</h4>
            <p><strong>Pour imprimer les couleurs des modules :</strong></p>
            <div style="margin-left: 15px; line-height: 1.6;">
                <p>• <strong>Chrome/Edge :</strong> Ctrl+P  Plus de paramètres  ✅ Graphiques d'arrière-plan</p>
                <p>• <strong>Firefox :</strong> Ctrl+P  Plus de paramètres  ✅ Imprimer les arrière-plans</p>
                <p>• <strong>Safari :</strong> Cmd+P  Safari  ✅ Imprimer les arrière-plans</p>
            </div>
        </div>
        
    </body>
    <script>
        // Optimisation automatique pour impression des couleurs
        document.addEventListener('DOMContentLoaded', function() {
            // Optimisation couleurs rapport activée
            
            // Force l'affichage des couleurs pour tous les modules
            const modules = document.querySelectorAll('.module');
            modules.forEach(module => {
                // Propriétés CSS pour forcer l'impression couleurs
                module.style.webkitPrintColorAdjust = 'exact';
                module.style.colorAdjust = 'exact';
                module.style.printColorAdjust = 'exact';
            });
            
            // Optimisation avant impression
            window.addEventListener('beforeprint', function() {
                // Impression détectée - force des couleurs
                
                // Force chaque couleur individuellement
                document.querySelectorAll('.module.ok').forEach(el => {
                    el.style.setProperty('background-color', '#22c55e', 'important');
                });
                document.querySelectorAll('.module.inequality').forEach(el => {
                    el.style.setProperty('background-color', '#eab308', 'important');
                });
                document.querySelectorAll('.module.microcracks').forEach(el => {
                    el.style.setProperty('background-color', '#f97316', 'important');
                });
                document.querySelectorAll('.module.dead').forEach(el => {
                    el.style.setProperty('background-color', '#ef4444', 'important');
                });
                document.querySelectorAll('.module.string_open').forEach(el => {
                    el.style.setProperty('background-color', '#3b82f6', 'important');
                });
                document.querySelectorAll('.module.not_connected').forEach(el => {
                    el.style.setProperty('background-color', '#6b7280', 'important');
                });
            });
        });
    </script>
    </html>
  `
}

function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    'ok': 'OK OK',
    'inequality': 'Inegalite Inégalité',
    'microcracks': 'Fissures Microfissures',
    'dead': 'HS Impact Cellulaire',
    'string_open': 'String String ouvert',
    'not_connected': 'Non-connecte Non raccordé'
  }
  return labels[status] || status
}

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
