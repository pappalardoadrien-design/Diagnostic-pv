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
import { getCrmProjectsCreatePage } from './pages/crm-projects-create'
import { getPlanningDashboardPage } from './pages/planning-dashboard'
import { getPlanningCreatePage } from './pages/planning-create'
import { getLoginPage } from './pages/login'
import crmUnifiedViewPage from './pages/crm-unified-view'

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

// Fix 404 for Editor - Redirect to Static File
// Le module Designer utilise ce lien, mais le fichier est statique dans public/static/pv/editor.html
app.get('/pv/plant/:plantId/zone/:zoneId/editor', (c) => {
  const plantId = c.req.param('plantId')
  const zoneId = c.req.param('zoneId')
  return c.redirect(`/static/pv/editor.html?plantId=${plantId}&zoneId=${zoneId}`)
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
app.get('/crm/clients/create', (c) => c.html(getCrmClientsCreatePage()))
app.get('/crm/projects/create', (c) => c.html(getCrmProjectsCreatePage()))

// === PAGES PLANNING ===
app.get('/planning', (c) => c.html(getPlanningDashboardPage()))
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

  // 4. Mettre à jour les tables VISUAL et PROJECTS (Girasole & Thermal)
  await runQuery("ALTER TABLE visual_inspections ADD COLUMN checklist_type TEXT DEFAULT 'IEC_62446'", "Visual: Ajout checklist_type")
  await runQuery("ALTER TABLE visual_inspections ADD COLUMN project_id INTEGER", "Visual: Ajout project_id")
  await runQuery("ALTER TABLE projects ADD COLUMN is_girasole INTEGER DEFAULT 0", "Projects: Ajout is_girasole")
  await runQuery("ALTER TABLE projects ADD COLUMN id_referent TEXT", "Projects: Ajout id_referent")
  await runQuery("ALTER TABLE thermal_measurements ADD COLUMN audit_token TEXT", "Thermal: Ajout audit_token")

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
// ROUTE /AUDIT/:TOKEN/PHOTOS - INTERFACE UPLOAD PHOTOS EL + IA PICSELLIA
// ============================================================================
app.get('/audit/:token/photos', (c) => {
  const token = c.req.param('token')
  return c.html(getAuditPhotosPage(token))
})

// ============================================================================
// ROUTE MODULE EL - ACCÈS DIRECT CRÉATION
// ============================================================================
app.get('/el', (c) => {
  // Redirection vers le Wizard de création qui pré-coche "EL"
  return c.redirect('/audits/create?type=EL');
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
                        OK OK<br><span class="text-sm font-normal">Aucun défaut détecté</span>
                    </button>
                    <button class="module-status-btn bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold" data-status="inequality">
                        Inegalite Inégalité<br><span class="text-sm font-normal">Qualité cellules</span>
                    </button>
                    <button class="module-status-btn bg-orange-600 hover:bg-orange-700 p-3 rounded font-bold" data-status="microcracks">
                        Fissures Microfissures<br><span class="text-sm font-normal">Visibles EL</span>
                    </button>
                    <button class="module-status-btn bg-red-600 hover:bg-red-700 p-3 rounded font-bold" data-status="dead">
                        HS Impact Cellulaire<br><span class="text-sm font-normal">Défaut cellulaire majeur</span>
                    </button>
                    <button class="module-status-btn bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold" data-status="string_open">
                        String String ouvert<br><span class="text-sm font-normal">Sous-string ouvert</span>
                    </button>
                    <button class="module-status-btn bg-gray-600 hover:bg-gray-700 p-3 rounded font-bold" data-status="not_connected">
                        Non-connecte Non raccordé<br><span class="text-sm font-normal">Non connecté</span>
                    </button>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-bold mb-2">Commentaire (optionnel) :</label>
                    <input type="text" id="moduleComment" 
                           class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-yellow-400 focus:outline-none"
                           placeholder="Détails du défaut...">
                </div>
                
                <div class="flex space-x-3">
                    <button id="validateBtn" class="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-black">
                        VALIDER
                    </button>
                    <button id="cancelBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
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

// Route Dashboard - Tableau de bord audits en temps réel
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - DiagPV Audits</title>
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
    <body class="bg-black text-white min-h-screen font-bold">
        <!-- Header Dashboard -->
        <header class="bg-gray-900 border-b-2 border-orange-400 p-4">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <i class="fas fa-tachometer-alt text-3xl text-orange-400"></i>
                    <div>
                        <h1 class="text-2xl font-black">DASHBOARD AUDITS</h1>
                        <p class="text-gray-300">Tableau de bord temps réel - DiagPV</p>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <a href="/" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-home mr-1"></i>ACCUEIL
                    </a>
                    <a href="/pv/plants" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-solar-panel mr-1"></i>PV CARTO
                    </a>
                    <button id="refreshBtn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-sync-alt mr-1"></i>ACTUALISER
                    </button>
                    <button id="autoRefreshBtn" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-play mr-1"></i>AUTO (OFF)
                    </button>
                </div>
            </div>
        </header>

        <!-- Statistiques globales -->
        <div class="container mx-auto p-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-blue-900 rounded-lg p-4 text-center">
                    <i class="fas fa-clipboard-list text-3xl text-blue-400 mb-2"></i>
                    <div class="text-2xl font-black" id="totalAudits">0</div>
                    <div class="text-sm text-gray-300">Audits Totaux</div>
                </div>
                
                <div class="bg-green-900 rounded-lg p-4 text-center">
                    <i class="fas fa-play text-3xl text-green-400 mb-2"></i>
                    <div class="text-2xl font-black" id="activeAudits">0</div>
                    <div class="text-sm text-gray-300">En Cours</div>
                </div>
                
                <div class="bg-orange-900 rounded-lg p-4 text-center">
                    <i class="fas fa-solar-panel text-3xl text-orange-400 mb-2"></i>
                    <div class="text-2xl font-black" id="totalModules">0</div>
                    <div class="text-sm text-gray-300">Modules Totaux</div>
                </div>
                
                <div class="bg-red-900 rounded-lg p-4 text-center">
                    <i class="fas fa-exclamation-triangle text-3xl text-red-400 mb-2"></i>
                    <div class="text-2xl font-black" id="totalDefauts">0</div>
                    <div class="text-sm text-gray-300">Défauts Détectés</div>
                </div>
            </div>

            <!-- Dernière mise à jour -->
            <div class="mb-6 text-center">
                <span class="text-gray-400">Dernière mise à jour : </span>
                <span id="lastUpdate" class="text-green-400 font-black">--:--:--</span>
                <span id="autoStatus" class="ml-4 px-2 py-1 bg-gray-600 rounded text-xs">MANUEL</span>
            </div>

            <!-- Liste des audits -->
            <div class="bg-gray-900 rounded-lg p-6 border border-gray-600">
                <h2 class="text-xl font-black mb-4 flex items-center">
                    <i class="fas fa-list mr-2 text-blue-400"></i>
                    AUDITS EN COURS
                </h2>
                
                <!-- Loading -->
                <div id="loading" class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-3xl text-blue-400 mb-4"></i>
                    <p class="text-gray-400">Chargement des audits...</p>
                </div>
                
                <!-- Table audits -->
                <div id="auditsContainer" class="hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-gray-600">
                                    <th class="text-left py-3 px-2 text-orange-400">Projet</th>
                                    <th class="text-left py-3 px-2 text-orange-400">Client</th>
                                    <th class="text-left py-3 px-2 text-orange-400">Localisation</th>
                                    <th class="text-center py-3 px-2 text-orange-400">Modules</th>
                                    <th class="text-center py-3 px-2 text-orange-400">Progression</th>
                                    <th class="text-center py-3 px-2 text-orange-400">Défauts</th>
                                    <th class="text-center py-3 px-2 text-orange-400">Statut</th>
                                    <th class="text-center py-3 px-2 text-orange-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="auditsTable">
                                <!-- Audits seront chargés ici -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Aucun audit -->
                <div id="noAudits" class="hidden text-center py-8">
                    <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-400 text-lg">Aucun audit trouvé</p>
                    <a href="/" class="inline-block mt-4 bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-bold">
                        <i class="fas fa-plus mr-2"></i>CRÉER UN AUDIT
                    </a>
                </div>
            </div>
        </div>
        
        <script src="/static/diagpv-dashboard.js"></script>
    </body>
    </html>
  `)
})

// ============================================================================
// ROUTE PV CARTOGRAPHY - Liste centrales PV (NOUVEAU - NON-DESTRUCTIF)
// ============================================================================
app.get('/pv/plants', (c) => {
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

// ============================================================================
// ROUTE UNIFIED INSTALLATIONS - Vue combinée EL + PV
// ============================================================================
app.get('/pv/installations', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Installations - DiagPV Audit</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-950 text-white min-h-screen">
        <!-- Header -->
        <header class="bg-gray-900 border-b-2 border-purple-600 py-4 px-6">
            <div class="max-w-7xl mx-auto flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <a href="/" class="text-purple-400 hover:text-purple-300">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </a>
                    <h1 class="text-3xl font-black text-white">
                        <i class="fas fa-th-large mr-3 text-purple-400"></i>INSTALLATIONS
                    </h1>
                </div>
                <div class="flex gap-3">
                    <button id="filterAll" class="px-4 py-2 bg-purple-600 rounded font-bold">
                        <i class="fas fa-layer-group mr-2"></i>TOUS
                    </button>
                    <button id="filterEL" class="px-4 py-2 bg-gray-700 hover:bg-green-600 rounded font-bold">
                        <i class="fas fa-bolt mr-2"></i>MODULE EL
                    </button>
                    <button id="filterPV" class="px-4 py-2 bg-gray-700 hover:bg-purple-600 rounded font-bold">
                        <i class="fas fa-solar-panel mr-2"></i>PV CARTO
                    </button>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-8 px-6">
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-6 mb-8">
                <div class="bg-gray-900 border-2 border-green-500 rounded-lg p-6 text-center">
                    <div class="text-4xl font-black text-green-400" id="statEL">0</div>
                    <div class="text-gray-400 mt-2">Audits EL</div>
                </div>
                <div class="bg-gray-900 border-2 border-purple-500 rounded-lg p-6 text-center">
                    <div class="text-4xl font-black text-purple-400" id="statPV">0</div>
                    <div class="text-gray-400 mt-2">Centrales PV</div>
                </div>
                <div class="bg-gray-900 border-2 border-blue-500 rounded-lg p-6 text-center">
                    <div class="text-4xl font-black text-blue-400" id="statLinked">0</div>
                    <div class="text-gray-400 mt-2">Liens EL ↔ PV</div>
                </div>
            </div>

            <!-- Liste installations -->
            <div id="installationsList" class="space-y-4">
                <div class="text-center py-12 text-gray-400">
                    <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
                    <p class="text-xl">Chargement des installations...</p>
                </div>
            </div>
        </main>

        <script>
        let allData = { el_audits: [], pv_plants: [] }
        let currentFilter = 'all'

        // Charger données
        async function loadInstallations() {
            try {
                const response = await fetch('/api/pv/installations-data')
                const data = await response.json()
                
                if (!data.success) {
                    throw new Error(data.error || 'Erreur chargement')
                }
                
                allData = data
                
                // Mettre à jour stats
                document.getElementById('statEL').textContent = data.total_el
                document.getElementById('statPV').textContent = data.total_pv
                document.getElementById('statLinked').textContent = 
                    data.el_audits.filter(a => a.pv_plant_id).length + 
                    data.pv_plants.filter(p => p.el_audit_id).length
                
                // Afficher liste
                renderInstallations()
                
            } catch (error) {
                console.error('Erreur:', error)
                document.getElementById('installationsList').innerHTML = 
                    '<div class="text-center py-12 text-red-400">' +
                    '<i class="fas fa-exclamation-triangle text-4xl mb-4"></i>' +
                    '<p class="text-xl">Erreur chargement installations</p>' +
                    '</div>'
            }
        }

        // Afficher installations selon filtre
        function renderInstallations() {
            const container = document.getElementById('installationsList')
            const items = []
            
            // Audits EL
            if (currentFilter === 'all' || currentFilter === 'el') {
                allData.el_audits.forEach(audit => {
                    items.push(renderELAudit(audit))
                })
            }
            
            // Centrales PV
            if (currentFilter === 'all' || currentFilter === 'pv') {
                allData.pv_plants.forEach(plant => {
                    items.push(renderPVPlant(plant))
                })
            }
            
            if (items.length === 0) {
                container.innerHTML = '<div class="text-center py-12 text-gray-400"><i class="fas fa-inbox text-4xl mb-4"></i><p class="text-xl">Aucune installation</p></div>'
            } else {
                container.innerHTML = items.join('')
            }
        }

        // Render audit EL
        function renderELAudit(audit) {
            const linkedBadge = audit.pv_plant_id ? 
                '<span class="px-3 py-1 bg-blue-600 rounded text-sm"><i class="fas fa-link mr-1"></i>Lié à ' + audit.linked_plant_name + '</span>' : 
                '<span class="px-3 py-1 bg-gray-700 rounded text-sm"><i class="fas fa-unlink mr-1"></i>Non lié</span>'
            
            const defectsBadge = audit.modules_with_defects > 0 ?
                '<span class="px-3 py-1 bg-red-900/50 border border-red-500/30 rounded text-sm"><i class="fas fa-exclamation-triangle mr-1 text-red-400"></i>' + audit.modules_with_defects + ' défaut(s)</span>' :
                '<span class="px-3 py-1 bg-green-900/50 border border-green-500/30 rounded text-sm"><i class="fas fa-check-circle mr-1 text-green-400"></i>Aucun défaut</span>'
            
            return '<div class="bg-gray-900 border-l-4 border-green-500 rounded-lg p-6 hover:bg-gray-800 transition-all">' +
                '<div class="flex items-start justify-between mb-3">' +
                    '<div class="flex-1">' +
                        '<div class="flex items-center gap-3 mb-2">' +
                            '<span class="px-3 py-1 bg-green-600 rounded font-bold text-sm"><i class="fas fa-bolt mr-2"></i>MODULE EL</span>' +
                            linkedBadge +
                        '</div>' +
                        '<h3 class="text-2xl font-bold text-white mb-1">' + audit.project_name + '</h3>' +
                        '<p class="text-gray-400"><i class="fas fa-user mr-2"></i>' + audit.client_name + (audit.location ? ' • ' + audit.location : '') + '</p>' +
                    '</div>' +
                    '<div class="flex gap-3">' +
                        (audit.pv_plant_id ? 
                            '<a href="/pv/plant/' + audit.pv_plant_id + '/zone/' + audit.pv_zone_id + '/editor/v2" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-bold"><i class="fas fa-map mr-2"></i>CARTO</a>' : 
                            '<a href="/api/pv/el-audit/' + audit.audit_token + '/quick-map" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold"><i class="fas fa-plus mr-2"></i>CRÉER PV</a>') +
                        '<a href="/el/zone/' + audit.id + '/editor" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-bold"><i class="fas fa-edit mr-2"></i>ÉDITER</a>' +
                    '</div>' +
                '</div>' +
                '<div class="grid grid-cols-4 gap-3 mb-3">' +
                    '<div class="bg-black rounded p-3 text-center"><div class="text-2xl font-bold text-purple-400">' + audit.total_modules + '</div><div class="text-xs text-gray-500">Modules</div></div>' +
                    '<div class="bg-black rounded p-3 text-center"><div class="text-2xl font-bold text-blue-400">' + audit.string_count + '</div><div class="text-xs text-gray-500">Strings</div></div>' +
                    '<div class="bg-black rounded p-3 text-center"><div class="text-2xl font-bold text-cyan-400">' + audit.string_count + '×' + audit.modules_per_string + '</div><div class="text-xs text-gray-500">Config</div></div>' +
                    '<div class="bg-black rounded p-3 text-center"><div class="text-2xl font-bold text-orange-400">' + (audit.completion_rate || 0).toFixed(0) + '%</div><div class="text-xs text-gray-500">Avancement</div></div>' +
                '</div>' +
                '<div class="flex flex-wrap gap-2">' +
                    '<span class="px-3 py-1 bg-purple-900/50 border border-purple-500/30 rounded text-sm"><i class="fas fa-calendar mr-1 text-purple-400"></i>' + new Date(audit.created_at).toLocaleDateString('fr-FR') + '</span>' +
                    defectsBadge +
                '</div>' +
            '</div>'
        }

        // Render centrale PV
        function renderPVPlant(plant) {
            const linkedBadge = plant.el_audit_id ? 
                '<span class="px-3 py-1 bg-blue-600 rounded text-sm"><i class="fas fa-link mr-1"></i>Lié à ' + plant.linked_audit_name + '</span>' : 
                '<span class="px-3 py-1 bg-gray-700 rounded text-sm"><i class="fas fa-unlink mr-1"></i>Non lié</span>'
            
            return '<div class="bg-gray-900 border-l-4 border-purple-500 rounded-lg p-6 hover:bg-gray-800 transition-all">' +
                '<div class="flex items-start justify-between mb-3">' +
                    '<div class="flex-1">' +
                        '<div class="flex items-center gap-3 mb-2">' +
                            '<span class="px-3 py-1 bg-purple-600 rounded font-bold text-sm"><i class="fas fa-solar-panel mr-2"></i>PV CARTO</span>' +
                            linkedBadge +
                        '</div>' +
                        '<h3 class="text-2xl font-bold text-white mb-1">' + plant.plant_name + '</h3>' +
                        '<p class="text-gray-400"><i class="fas fa-map-marker-alt mr-2"></i>' + (plant.address || 'Adresse non définie') + '</p>' +
                    '</div>' +
                    '<div class="flex gap-3">' +
                        (plant.el_audit_id ? 
                            '<a href="/el/zone/' + plant.el_audit_id + '/editor" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold"><i class="fas fa-bolt mr-2"></i>AUDIT EL</a>' : 
                            '<button onclick="createELAudit(' + plant.plant_id + ', \'' + plant.plant_name + '\')" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold"><i class="fas fa-plus mr-2"></i>CRÉER AUDIT EL</button>') +
                        '<a href="/pv/plant/' + plant.plant_id + '" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-bold"><i class="fas fa-eye mr-2"></i>VOIR</a>' +
                    '</div>' +
                '</div>' +
                '<div class="grid grid-cols-3 gap-3 mb-3">' +
                    '<div class="bg-black rounded p-3 text-center"><div class="text-2xl font-bold text-purple-400">' + plant.zones_count + '</div><div class="text-xs text-gray-500">Zones</div></div>' +
                    '<div class="bg-black rounded p-3 text-center"><div class="text-2xl font-bold text-blue-400">' + plant.modules_count + '</div><div class="text-xs text-gray-500">Modules</div></div>' +
                    '<div class="bg-black rounded p-3 text-center"><div class="text-2xl font-bold text-orange-400">' + (plant.total_power_kwp || 0) + '</div><div class="text-xs text-gray-500">kWc</div></div>' +
                '</div>' +
                '<div class="flex flex-wrap gap-2">' +
                    '<span class="px-3 py-1 bg-purple-900/50 border border-purple-500/30 rounded text-sm"><i class="fas fa-calendar mr-1 text-purple-400"></i>' + new Date(plant.created_at).toLocaleDateString('fr-FR') + '</span>' +
                '</div>' +
            '</div>'
        }

        // Filtres
        document.getElementById('filterAll').addEventListener('click', () => {
            currentFilter = 'all'
            document.getElementById('filterAll').classList.add('bg-purple-600')
            document.getElementById('filterAll').classList.remove('bg-gray-700')
            document.getElementById('filterEL').classList.add('bg-gray-700')
            document.getElementById('filterEL').classList.remove('bg-green-600')
            document.getElementById('filterPV').classList.add('bg-gray-700')
            document.getElementById('filterPV').classList.remove('bg-purple-600')
            renderInstallations()
        })

        document.getElementById('filterEL').addEventListener('click', () => {
            currentFilter = 'el'
            document.getElementById('filterAll').classList.remove('bg-purple-600')
            document.getElementById('filterAll').classList.add('bg-gray-700')
            document.getElementById('filterEL').classList.add('bg-green-600')
            document.getElementById('filterEL').classList.remove('bg-gray-700')
            document.getElementById('filterPV').classList.add('bg-gray-700')
            document.getElementById('filterPV').classList.remove('bg-purple-600')
            renderInstallations()
        })

        document.getElementById('filterPV').addEventListener('click', () => {
            currentFilter = 'pv'
            document.getElementById('filterAll').classList.remove('bg-purple-600')
            document.getElementById('filterAll').classList.add('bg-gray-700')
            document.getElementById('filterEL').classList.add('bg-gray-700')
            document.getElementById('filterEL').classList.remove('bg-green-600')
            document.getElementById('filterPV').classList.add('bg-purple-600')
            document.getElementById('filterPV').classList.remove('bg-gray-700')
            renderInstallations()
        })

        // Créer audit EL depuis centrale PV
        async function createELAudit(plantId, plantName) {
            const projectName = prompt('Nom du projet:', plantName + ' - Audit EL')
            if (!projectName) return
            
            const clientName = prompt('Nom du client:', 'Client')
            if (!clientName) return
            
            try {
                const response = await fetch('/api/pv/plant/' + plantId + '/create-el-audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        project_name: projectName, 
                        client_name: clientName 
                    })
                })
                
                const data = await response.json()
                
                if (data.success) {
                    alert('✅ Audit EL créé avec succès!\\n' + data.modules_created + ' modules importés')
                    window.location.href = data.redirect_url
                } else {
                    alert('❌ Erreur: ' + data.error)
                }
            } catch (error) {
                console.error('Erreur:', error)
                alert('❌ Erreur création audit EL')
            }
        }

        // Charger au démarrage
        loadInstallations()
        </script>
    </body>
    </html>
  `)
})

// ============================================================================
// ROUTE PV CARTOGRAPHY - Canvas Editor (PHASE 2b)
// ============================================================================
app.get('/pv/plant/:plantId/zone/:zoneId/editor', async (c) => {
  const plantId = c.req.param('plantId')
  const zoneId = c.req.param('zoneId')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Canvas Editor - Zone PV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <style>
            /* CSS identique Module EL pour status modules */
            .module-rect.ok { fill: #22c55e; }
            .module-rect.inequality { fill: #eab308; }
            .module-rect.microcracks { fill: #f97316; }
            .module-rect.dead { fill: #ef4444; }
            .module-rect.string_open { fill: #3b82f6; }
            .module-rect.not_connected { fill: #6b7280; }
            .module-rect.pending { fill: #e5e7eb; stroke: #9ca3af; stroke-dasharray: 2,2; }
            
            @keyframes pulse-danger {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .module-rect.dead {
                animation: pulse-danger 2s infinite;
            }
            
            #canvas { 
                border: 2px solid #9333ea; 
                cursor: crosshair;
                max-width: 100%;
                display: block;
            }
            
            .mode-btn.active {
                background-color: #9333ea !important;
            }
        </style>
    </head>
    <body class="bg-black text-white min-h-screen">
        <!-- Header Navigation -->
        <div class="bg-gray-900 border-b-2 border-purple-400 p-4">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex gap-3">
                    <a href="/pv/plant/${plantId}" class="text-purple-400 hover:text-purple-300 font-bold">
                        <i class="fas fa-arrow-left mr-2"></i>RETOUR ZONE
                    </a>
                    <h1 id="zoneTitle" class="text-xl font-black">Zone...</h1>
                </div>
                <div class="flex gap-3">
                    <button id="saveBtn" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-black">
                        <i class="fas fa-save mr-2"></i>ENREGISTRER
                    </button>
                    <button id="exportBtn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-file-pdf mr-2"></i>EXPORT PDF
                    </button>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 py-6">
            <!-- Toolbar -->
            <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-4 mb-6">
                <div class="flex flex-wrap gap-3 items-center">
                    <!-- Mode Placement -->
                    <div class="flex gap-2">
                        <button id="modeManualBtn" class="mode-btn active bg-purple-600 px-4 py-2 rounded font-bold">
                            <i class="fas fa-mouse-pointer mr-2"></i>MANUEL
                        </button>
                        <button id="modeGridBtn" class="mode-btn bg-gray-600 px-4 py-2 rounded font-bold">
                            <i class="fas fa-th mr-2"></i>GRILLE AUTO
                        </button>
                    </div>
                    
                    <!-- Upload Image Fond -->
                    <div>
                        <label class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold cursor-pointer">
                            <i class="fas fa-image mr-2"></i>IMAGE FOND
                            <input type="file" id="uploadBackground" accept="image/*" class="hidden">
                        </label>
                    </div>
                    
                    <!-- Rotation -->
                    <div class="flex gap-2 items-center">
                        <button id="rotateBtn" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold">
                            <i class="fas fa-redo mr-2"></i>ROTATION
                        </button>
                        <span id="rotationLabel" class="px-3 py-2 bg-gray-800 rounded font-bold">0°</span>
                    </div>
                    
                    <!-- Config Grille -->
                    <div class="flex gap-2 items-center border-l-2 border-gray-600 pl-3">
                        <label class="text-sm font-bold">Lignes:</label>
                        <input type="number" id="gridRows" value="10" min="1" max="50" 
                               class="w-16 bg-black border border-gray-600 rounded px-2 py-1 text-center font-bold">
                        <label class="text-sm font-bold">Cols:</label>
                        <input type="number" id="gridCols" value="10" min="1" max="50" 
                               class="w-16 bg-black border border-gray-600 rounded px-2 py-1 text-center font-bold">
                        <button id="applyGridBtn" class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-bold">
                            APPLIQUER
                        </button>
                    </div>
                    
                    <!-- Reset -->
                    <button id="clearBtn" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold ml-auto">
                        <i class="fas fa-trash mr-2"></i>EFFACER TOUT
                    </button>
                </div>
            </div>

            <!-- Canvas -->
            <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-4 mb-6">
                <canvas id="canvas" width="1200" height="800"></canvas>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-7 gap-3">
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-purple-400">
                    <div class="text-xl font-black text-purple-400" id="statsTotal">0</div>
                    <div class="text-xs text-gray-400">Total</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-green-400">
                    <div class="text-xl font-black text-green-400" id="statsOk">0</div>
                    <div class="text-xs text-gray-400">OK OK</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-yellow-400">
                    <div class="text-xl font-black text-yellow-400" id="statsInequality">0</div>
                    <div class="text-xs text-gray-400">Inegalite Inégalité</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-orange-400">
                    <div class="text-xl font-black text-orange-400" id="statsMicrocracks">0</div>
                    <div class="text-xs text-gray-400">Fissures Fissures</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-red-400">
                    <div class="text-xl font-black text-red-400" id="statsDead">0</div>
                    <div class="text-xs text-gray-400">HS Impact Cellulaire</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-blue-400">
                    <div class="text-xl font-black text-blue-400" id="statsStringOpen">0</div>
                    <div class="text-xs text-gray-400">String String</div>
                </div>
                <div class="bg-gray-900 rounded-lg p-3 text-center border border-gray-400">
                    <div class="text-xl font-black text-gray-400" id="statsPending">0</div>
                    <div class="text-xs text-gray-400">Pending Pending</div>
                </div>
            </div>
        </div>

        <!-- Modal Statut Module (IDENTIQUE Module EL) -->
        <div id="moduleModal" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-md w-full">
                <h3 id="modalTitle" class="text-xl font-black mb-4 text-center">MODULE M000</h3>
                
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <button class="module-status-btn bg-green-600 hover:bg-green-700 p-3 rounded font-bold" data-status="ok">
                        OK OK<br><span class="text-sm font-normal">Aucun défaut détecté</span>
                    </button>
                    <button class="module-status-btn bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold" data-status="inequality">
                        Inegalite Inégalité<br><span class="text-sm font-normal">Qualité cellules</span>
                    </button>
                    <button class="module-status-btn bg-orange-600 hover:bg-orange-700 p-3 rounded font-bold" data-status="microcracks">
                        Fissures Microfissures<br><span class="text-sm font-normal">Visibles EL</span>
                    </button>
                    <button class="module-status-btn bg-red-600 hover:bg-red-700 p-3 rounded font-bold" data-status="dead">
                        HS Impact Cellulaire<br><span class="text-sm font-normal">Défaut cellulaire majeur</span>
                    </button>
                    <button class="module-status-btn bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold" data-status="string_open">
                        String String ouvert<br><span class="text-sm font-normal">Sous-string ouvert</span>
                    </button>
                    <button class="module-status-btn bg-gray-600 hover:bg-gray-700 p-3 rounded font-bold" data-status="not_connected">
                        Non-connecte Non raccordé<br><span class="text-sm font-normal">Non connecté</span>
                    </button>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-bold mb-2">Commentaire (optionnel) :</label>
                    <input type="text" id="moduleComment" 
                           class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-yellow-400 focus:outline-none"
                           placeholder="Détails du défaut...">
                </div>
                
                <div class="flex gap-3">
                    <button id="saveStatusBtn" class="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-black">
                        ENREGISTRER
                    </button>
                    <button id="cancelStatusBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
                </div>
            </div>
        </div>

        <script>
        // VARIABLES GLOBALES
        const plantId = '${plantId}'
        const zoneId = '${zoneId}'
        const canvas = document.getElementById('canvas')
        const ctx = canvas.getContext('2d')
        
        let modules = []
        let zoneData = null
        let backgroundImage = null
        let placementMode = 'manual'
        let currentRotation = 0
        // VARIABLES GLOBALES
        const plantId = '${plantId}'
        const zoneId = '${zoneId}'
        const canvas = document.getElementById('canvas')
        const ctx = canvas.getContext('2d')
        
        let modules = []
        let zoneData = null
        let backgroundImage = null
        let placementMode = 'manual'
        let currentRotation = 0
        let selectedModule = null
        let nextModuleNum = 1
        
        // DIMENSIONS MODULE (pixels, ratio 1.7:1)
        const MODULE_WIDTH_PX = 51
        const MODULE_HEIGHT_PX = 30
        const SCALE = 30 // 30 px = 1 m
        
        // COULEURS STATUS (IDENTIQUE Module EL)
        const STATUS_COLORS = {
            ok: '#22c55e',
            inequality: '#eab308',
            microcracks: '#f97316',
            dead: '#ef4444',
            string_open: '#3b82f6',
            not_connected: '#6b7280',
            pending: '#e5e7eb'
        }
        
        // ========================================================================
        // INIT
        // ========================================================================
        async function init() {
            await loadZone()
            await loadModules()
            
            // Restaurer rectangles sauvegardés (rotation, dimensions, position)
            restoreRectanglesConfig()
            
            // Restaurer config strings depuis localStorage si DB vide
            if (stringsConfig.length === 0) {
                restoreStringsConfigFromLocalStorage()
            }
            
            // Vérifier liaison audit EL
            await checkElLink()
            
            render()
            setupEventListeners()
        }
        
        async function loadZone() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}\`)
                const data = await response.json()
                zoneData = data.zone
                
                document.getElementById('zoneTitle').textContent = zoneData.zone_name
                
                if (zoneData.background_image_url) {
                    backgroundImage = new Image()
                    backgroundImage.src = zoneData.background_image_url
                    backgroundImage.onload = () => render()
                }
            } catch (error) {
                console.error('Erreur chargement zone:', error)
            }
        }
        
        async function loadModules() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`)
                const data = await response.json()
                modules = data.modules || []
                
                if (modules.length > 0) {
                    nextModuleNum = Math.max(...modules.map(m => {
                        const match = m.module_identifier.match(/\\d+/)
                        return match ? parseInt(match[0]) : 0
                    })) + 1
                }
                
                updateStats()
            } catch (error) {
                console.error('Erreur chargement modules:', error)
            }
        }
        
        // ========================================================================
        // RENDER
        // ========================================================================
        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            // Fond noir
            ctx.fillStyle = '#000'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // Image fond si chargée
            if (backgroundImage) {
                ctx.globalAlpha = 0.6
                ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)
                ctx.globalAlpha = 1.0
            }
            
            // Modules
            modules.forEach(module => {
                drawModule(module)
            })
        }
        
        function drawModule(module) {
            const x = module.pos_x_meters * SCALE
            const y = module.pos_y_meters * SCALE
            const width = module.width_meters * SCALE
            const height = module.height_meters * SCALE
            
            ctx.save()
            ctx.translate(x + width/2, y + height/2)
            ctx.rotate(module.rotation * Math.PI / 180)
            
            // Rectangle module avec couleur status
            ctx.fillStyle = STATUS_COLORS[module.module_status] || STATUS_COLORS.pending
            ctx.fillRect(-width/2, -height/2, width, height)
            
            // Border
            ctx.strokeStyle = '#000'
            ctx.lineWidth = 2
            ctx.strokeRect(-width/2, -height/2, width, height)
            
            // Identifiant module
            ctx.fillStyle = '#000'
            ctx.font = 'bold 11px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(module.module_identifier, 0, 0)
            
            ctx.restore()
        }
        
        // ========================================================================
        // INTERACTIONS
        // ========================================================================
        function setupEventListeners() {
            // Canvas clic
            canvas.addEventListener('click', handleCanvasClick)
            
            // Modes
            document.getElementById('modeManualBtn').addEventListener('click', () => setMode('manual'))
            document.getElementById('modeGridBtn').addEventListener('click', () => setMode('grid'))
            
            // Rotation
            document.getElementById('rotateBtn').addEventListener('click', rotateNext)
            
            // Grille
            document.getElementById('applyGridBtn').addEventListener('click', applyGrid)
            
            // Upload fond
            document.getElementById('uploadBackground').addEventListener('change', handleImageUpload)
            
            // Clear
            document.getElementById('clearBtn').addEventListener('click', clearAll)
            
            // Save
            document.getElementById('saveBtn').addEventListener('click', saveModules)
            
            // Export
            document.getElementById('exportBtn').addEventListener('click', exportPDF)
            
            // Modal status
            document.querySelectorAll('.module-status-btn').forEach(btn => {
                btn.addEventListener('click', () => selectStatus(btn.dataset.status))
            })
            document.getElementById('cancelStatusBtn').addEventListener('click', closeModal)
        }
        
        function handleCanvasClick(e) {
            const rect = canvas.getBoundingClientRect()
            const x = (e.clientX - rect.left) * (canvas.width / rect.width)
            const y = (e.clientY - rect.top) * (canvas.height / rect.height)
            
            const clickedModule = findModuleAt(x, y)
            if (clickedModule) {
                openStatusModal(clickedModule)
            } else if (placementMode === 'manual') {
                addModule(x / SCALE, y / SCALE)
            }
        }
        
        function findModuleAt(x, y) {
            return modules.find(m => {
                const mx = m.pos_x_meters * SCALE
                const my = m.pos_y_meters * SCALE
                const mw = m.width_meters * SCALE
                const mh = m.height_meters * SCALE
                
                // Vérifier rotation
                const centerX = mx + mw/2
                const centerY = my + mh/2
                const angle = -m.rotation * Math.PI / 180
                
                const dx = x - centerX
                const dy = y - centerY
                const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle)
                const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle)
                
                return Math.abs(rotatedX) <= mw/2 && Math.abs(rotatedY) <= mh/2
            })
        }
        
        function addModule(xMeters, yMeters) {
            const newModule = {
                zone_id: parseInt(zoneId),
                module_identifier: \`M\${nextModuleNum}\`,
                string_number: 1,
                position_in_string: modules.length + 1,
                pos_x_meters: xMeters,
                pos_y_meters: yMeters,
                width_meters: 1.7,
                height_meters: 1.0,
                rotation: currentRotation,
                power_wp: 450,
                module_status: 'pending',
                status_comment: null
            }
            
            modules.push(newModule)
            nextModuleNum++
            render()
            updateStats()
        }
        
        function applyGrid() {
            const rows = parseInt(document.getElementById('gridRows').value)
            const cols = parseInt(document.getElementById('gridCols').value)
            const spacing = 0.02 // 2cm
            
            modules = []
            nextModuleNum = 1
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    modules.push({
                        zone_id: parseInt(zoneId),
                        module_identifier: 'M' + nextModuleNum,
                        string_number: Math.floor((nextModuleNum - 1) / cols) + 1,
                        position_in_string: ((nextModuleNum - 1) % cols) + 1,
                        pos_x_meters: col * (1.7 + spacing),
                        pos_y_meters: row * (1.0 + spacing),
                        width_meters: 1.7,
                        height_meters: 1.0,
                        rotation: currentRotation,
                        power_wp: 450,
                        module_status: 'pending',
                        status_comment: null
                    })
                    nextModuleNum++
                }
            }
            
            render()
            updateStats()
        }
        
        function rotateNext() {
            currentRotation = (currentRotation + 90) % 360
            document.getElementById('rotationLabel').textContent = currentRotation + '°'
        }
        
        function setMode(mode) {
            placementMode = mode
            document.getElementById('modeManualBtn').classList.toggle('active', mode === 'manual')
            document.getElementById('modeGridBtn').classList.toggle('active', mode === 'grid')
            
            if (mode === 'manual') {
                document.getElementById('modeManualBtn').classList.replace('bg-gray-600', 'bg-purple-600')
                document.getElementById('modeGridBtn').classList.replace('bg-purple-600', 'bg-gray-600')
            } else {
                document.getElementById('modeGridBtn').classList.replace('bg-gray-600', 'bg-purple-600')
                document.getElementById('modeManualBtn').classList.replace('bg-purple-600', 'bg-gray-600')
            }
        }
        
        function clearAll() {
            if (confirm('Effacer tous les modules ?')) {
                modules = []
                nextModuleNum = 1
                render()
                updateStats()
            }
        }
        
        // ========================================================================
        // MODAL STATUS
        // ========================================================================
        function openStatusModal(module) {
            selectedModule = module
            document.getElementById('modalTitle').textContent = module.module_identifier
            document.getElementById('moduleComment').value = module.status_comment || ''
            document.getElementById('moduleModal').classList.remove('hidden')
        }
        
        function closeModal() {
            document.getElementById('moduleModal').classList.add('hidden')
            selectedModule = null
        }
        
        function selectStatus(status) {
            if (!selectedModule) return
            
            selectedModule.module_status = status
            selectedModule.status_comment = document.getElementById('moduleComment').value || null
            
            closeModal()
            render()
            updateStats()
        }
        
        // ========================================================================
        // UPLOAD IMAGE
        // ========================================================================
        async function handleImageUpload(e) {
            const file = e.target.files[0]
            if (!file) return
            
            const reader = new FileReader()
            reader.onload = async (event) => {
                backgroundImage = new Image()
                backgroundImage.src = event.target.result
                backgroundImage.onload = () => {
                    render()
                    saveBackgroundImage(event.target.result)
                }
            }
            reader.readAsDataURL(file)
        }
        
        async function saveBackgroundImage(dataUrl) {
            try {
                await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/background\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_url: dataUrl,
                        image_type: 'upload',
                        width_meters: 50,
                        height_meters: 30
                    })
                })
            } catch (error) {
                console.error('Erreur sauvegarde image:', error)
            }
        }
        
        // ========================================================================
        // SAVE
        // ========================================================================
        async function saveModules() {
            try {
                // Supprimer modules existants
                await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`, {
                    method: 'DELETE'
                })
                
                if (modules.length === 0) {
                    alert('Aucun module à sauvegarder')
                    return
                }
                
                // Créer nouveaux modules
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ modules })
                })
                
                const data = await response.json()
                
                if (data.success) {
                    alert(\`\${data.added} module(s) sauvegardé(s) avec succès!\`)
                    await loadModules()
                } else {
                    alert('Erreur: ' + data.error)
                }
            } catch (error) {
                alert('Erreur sauvegarde: ' + error.message)
            }
        }
        
        // ========================================================================
        // ========================================================================
        // STATS
        // ========================================================================
        function updateStats() {
            document.getElementById('statsTotal').textContent = modules.length
            document.getElementById('statsOk').textContent = modules.filter(m => m.module_status === 'ok').length
            document.getElementById('statsInequality').textContent = modules.filter(m => m.module_status === 'inequality').length
            document.getElementById('statsMicrocracks').textContent = modules.filter(m => m.module_status === 'microcracks').length
            document.getElementById('statsDead').textContent = modules.filter(m => m.module_status === 'dead').length
            document.getElementById('statsStringOpen').textContent = modules.filter(m => m.module_status === 'string_open').length
            document.getElementById('statsPending').textContent = modules.filter(m => m.module_status === 'pending').length
        }
        
        // INIT
        init()
        <\/script>
    </body>
    </html>
  `)
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
  
  const buildTimestamp = Date.now()
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <!-- BUILD: ${buildTimestamp} - V2 Editor -->
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cartographie PV Pro - DiagPV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/leaflet-path-transform@2.1.3/dist/L.Path.Transform.js"></script>
        <link rel="stylesheet" href="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css" />
        <script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        
        <style>
            #map { height: 700px; width: 100%; border: 2px solid #9333ea; border-radius: 0.5rem; }
            .module-ok { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
            .module-inequality { background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); }
            .module-microcracks { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
            .module-dead { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); animation: pulse 2s infinite; }
            .module-string_open { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
            .module-not_connected { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); }
            .module-pending { background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%); border: 2px dashed #9ca3af !important; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
            
            /* Rectangle Module Group Styles */
            .module-rectangle {
                cursor: move;
                stroke-dasharray: 5, 5;
                stroke-width: 3px !important;
            }
            .module-rectangle:hover {
                stroke-width: 4px !important;
                opacity: 0.9;
            }
            .leaflet-path-transform-handler {
                fill: #fbbf24 !important;
                stroke: #ffffff !important;
                stroke-width: 2px;
            }
            .rectangle-grid-line {
                stroke: #ffffff;
                stroke-width: 1px;
                opacity: 0.3;
                pointer-events: none;
            }
            .rectangle-info-overlay {
                background: rgba(0, 0, 0, 0.85);
                color: white;
                padding: 10px;
                border-radius: 6px;
                font-size: 11px;
                border: 2px solid #fbbf24;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                pointer-events: none;
            }
            
            /* Fix z-index modal au-dessus de Leaflet */
            #statusModal { z-index: 9999 !important; }
            
            /* Handles de transformation personnalisés */
            .resize-handle {
                width: 12px !important;
                height: 12px !important;
                background: white !important;
                border: 2px solid #3b82f6 !important;
                border-radius: 2px !important;
                cursor: pointer !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
                z-index: 1000 !important;
            }
            .resize-handle:hover {
                background: #3b82f6 !important;
                transform: scale(1.3);
            }
            .rotation-handle {
                width: 20px !important;
                height: 20px !important;
                background: #3b82f6 !important;
                border: 3px solid white !important;
                border-radius: 50% !important;
                cursor: grab !important;
                box-shadow: 0 3px 6px rgba(0,0,0,0.4) !important;
                z-index: 1001 !important;
            }
            .rotation-handle:hover {
                background: #2563eb !important;
                transform: scale(1.2);
            }
            .rotation-handle:active {
                cursor: grabbing !important;
            }
        </style>
    </head>
    <body class="bg-black text-white">
        <!-- Header -->
        <div class="bg-gray-900 border-b-2 border-purple-400 p-4">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex gap-3 items-center">
                    <a href="/pv/plant/${plantId}" class="text-purple-400 hover:text-purple-300 font-bold">
                        <i class="fas fa-arrow-left mr-2"></i>RETOUR
                    </a>
                    <span class="text-sm bg-green-600 px-3 py-1 rounded font-bold"> VERSION PRO</span>
                    <h1 id="zoneTitle" class="text-xl font-black">Chargement...</h1>
                </div>
                <div class="flex gap-3">
                    <button id="elAuditBtn" class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-bold" title="Audit Électroluminescence">
                        <i class="fas fa-bolt mr-2"></i>AUDIT EL
                    </button>
                    <button id="importElAuditBtn" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold" title="Importer audit EL existant">
                        <i class="fas fa-download mr-2"></i>IMPORTER EL
                    </button>
                    <div id="elLinkStatus" class="hidden bg-purple-900 border-2 border-purple-500 px-4 py-2 rounded">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-link text-purple-400"></i>
                            <div class="flex-1">
                                <div class="text-xs text-purple-400 font-bold">LIÉ À AUDIT EL</div>
                                <div id="elLinkInfo" class="text-xs text-white"></div>
                            </div>
                            <button id="viewElAuditBtn" class="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs font-bold" title="Voir l'audit EL">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button id="resyncElBtn" class="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs font-bold" title="Re-synchroniser">
                                <i class="fas fa-sync"></i>
                            </button>
                            <button id="unlinkElBtn" class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-bold" title="Délier">
                                <i class="fas fa-unlink"></i>
                            </button>
                        </div>
                    </div>
                    <button id="saveAllBtn" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-black">
                        <i class="fas fa-save mr-2"></i>ENREGISTRER TOUT
                    </button>
                    <button id="exportBtn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-file-pdf mr-2"></i>EXPORT PDF
                    </button>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 py-6 grid grid-cols-4 gap-6">
            <!-- LEFT SIDEBAR: Configuration -->
            <div class="col-span-1 space-y-4">
                <!-- Étape 0 : Structures (DÉSACTIVÉ - Fait doublon avec toiture) -->
                <!--
                <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-purple-400">
                        <i class="fas fa-building mr-2"></i>ÉTAPE 0 : STRUCTURES
                    </h3>
                    <p class="text-xs text-gray-400 mb-3">Modéliser la centrale</p>
                    
                    <div class="space-y-2">
                        <button id="drawBuildingBtn" class="w-full bg-gray-600 hover:bg-gray-500 py-2 rounded font-bold text-sm">
                            <i class="fas fa-building mr-2"></i>Batiment Bâtiment
                        </button>
                        <button id="drawCarportBtn" class="w-full bg-yellow-600 hover:bg-yellow-500 py-2 rounded font-bold text-sm">
                            <i class="fas fa-parking mr-2"></i>️ Ombrière Parking
                        </button>
                        <button id="drawGroundBtn" class="w-full bg-green-600 hover:bg-green-500 py-2 rounded font-bold text-sm">
                            <i class="fas fa-sun mr-2"></i>Sol Champ au Sol
                        </button>
                        <button id="drawTechnicalBtn" class="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold text-sm">
                            <i class="fas fa-tools mr-2"></i>Tech Zone Technique
                        </button>
                    </div>
                    
                    <div id="structuresList" class="mt-4 space-y-2 hidden">
                        <div class="text-xs font-bold text-purple-400 mb-2">STRUCTURES CRÉÉES:</div>
                        <div id="structuresContainer" class="space-y-2 max-h-48 overflow-y-auto"></div>
                    </div>
                    
                    <div class="mt-3 p-2 bg-black rounded text-xs">
                        <div class="text-gray-400">Total surface:</div>
                        <div id="totalStructuresArea" class="text-lg font-black text-purple-400">0 m²</div>
                    </div>
                </div>
                -->
                
                <!-- Étape 1 : Toiture -->
                <div class="bg-gray-900 rounded-lg border-2 border-yellow-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-yellow-400">
                        <i class="fas fa-solar-panel mr-2"></i>ÉTAPE 1 : TOITURE
                    </h3>
                    <p class="text-xs text-gray-400 mb-3">Dessinez le contour de la zone PV</p>
                    <button id="drawRoofBtn" class="w-full bg-yellow-600 hover:bg-yellow-700 py-3 rounded font-bold mb-2">
                        <i class="fas fa-draw-polygon mr-2"></i>DESSINER TOITURE
                    </button>
                    <button id="clearRoofBtn" class="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-bold text-sm">
                        <i class="fas fa-trash mr-1"></i>Effacer
                    </button>
                    <div id="roofInfo" class="mt-3 p-3 bg-black rounded text-sm hidden">
                        <div class="text-gray-400">Surface toiture:</div>
                        <div id="roofArea" class="text-2xl font-black text-yellow-400">-- m²</div>
                    </div>
                </div>

                <!-- Étape 1B : Rectangle Modules (SolarEdge Style) -->
                <div class="bg-gray-900 rounded-lg border-2 border-orange-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-orange-400">
                        <i class="fas fa-th mr-2"></i>RECTANGLE MODULES
                    </h3>
                    <div class="space-y-2">
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">Rangées</label>
                                <input type="number" id="rectRows" min="1" max="50" value="5"
                                       class="w-full bg-black border border-gray-600 rounded px-2 py-1 text-center font-bold text-sm">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-400 mb-1">Colonnes</label>
                                <input type="number" id="rectCols" min="1" max="50" value="24"
                                       class="w-full bg-black border border-gray-600 rounded px-2 py-1 text-center font-bold text-sm">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">String Départ</label>
                            <input type="number" id="rectString" min="1" max="50" value="1"
                                   class="w-full bg-black border border-gray-600 rounded px-3 py-2 text-center font-bold">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Alignement</label>
                            <select id="rectAlignment" class="w-full bg-black border border-gray-600 rounded px-3 py-2 text-center font-bold text-sm">
                                <option value="center">Centre Centre</option>
                                <option value="north">Nord Nord (Haut)</option>
                                <option value="south">Sud️ Sud (Bas)</option>
                                <option value="east">Est️ Est (Droite)</option>
                                <option value="west">Ouest️ Ouest (Gauche)</option>
                                <option value="nw">↖️ Nord-Ouest</option>
                                <option value="ne">NE️ Nord-Est</option>
                                <option value="sw">SW️ Sud-Ouest</option>
                                <option value="se">SE️ Sud-Est</option>
                            </select>
                        </div>
                        <div class="p-2 bg-black rounded text-xs">
                            <div class="text-gray-400">Total modules:</div>
                            <div id="rectTotal" class="text-lg font-black text-orange-400">120</div>
                        </div>
                        <button id="createRectangleBtn" class="w-full bg-orange-600 hover:bg-orange-700 py-3 rounded font-bold">
                            <i class="fas fa-plus-square mr-2"></i>CRÉER RECTANGLE
                        </button>
                        <button id="importFromELBtn" class="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold text-sm mt-2">
                            <i class="fas fa-file-import mr-2"></i>IMPORTER DEPUIS MODULE EL
                        </button>
                        <button id="togglePersistentEditBtn" class="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded font-bold text-sm mt-2">
                            <i class="fas fa-lock-open mr-2"></i>MODE ÉDITION CONTINUE
                        </button>
                        <div id="persistentEditIndicator" class="mt-2 p-2 bg-green-900 rounded text-xs text-green-200 hidden">
                            <i class="fas fa-check-circle mr-1"></i><strong>Mode édition continue activé</strong><br/>
                            <span class="text-xs">Les handles restent visibles. Re-cliquez le bouton pour désactiver.</span>
                        </div>
                        <div class="mt-2 p-2 bg-blue-900 rounded text-xs text-blue-200">
                            <i class="fas fa-info-circle mr-1"></i><strong>Mode edition:</strong><br/>
                            • Coins → redimensionner<br/>
                            • Centre → rotation (paliers 5°)<br/>
                            • <strong>Shift + rotation</strong> → rotation libre
                        </div>
                        <div class="space-y-1 text-xs">
                            <div class="flex items-center gap-2">
                                <input type="checkbox" id="showModules" class="w-4 h-4">
                                <label for="showModules" class="text-gray-400">🔢 Afficher numéros modules</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <input type="checkbox" id="showRectGrid" class="w-4 h-4" checked>
                                <label for="showRectGrid" class="text-gray-400">✨ Afficher grille modules</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <input type="checkbox" id="showRectLabels" class="w-4 h-4">
                                <label for="showRectLabels" class="text-gray-400">Afficher labels (obsolète)</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <input type="checkbox" id="showRectInfo" class="w-4 h-4">
                                <label for="showRectInfo" class="text-gray-400">Info rectangle</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <input type="checkbox" id="liveRotationPreview" class="w-4 h-4" checked>
                                <label for="liveRotationPreview" class="text-gray-400">🔄 Aperçu temps réel rotation</label>
                            </div>
                        </div>
                    </div>
                    <div id="rectanglesList" class="mt-3 space-y-2 hidden">
                        <div class="text-xs font-bold text-orange-400 mb-1">RECTANGLES CRÉÉS:</div>
                        <div id="rectanglesContainer" class="space-y-2"></div>
                    </div>
                </div>

                <!-- Étape 2 : Configuration Électrique -->
                <div class="bg-gray-900 rounded-lg border-2 border-green-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-green-400">
                        <i class="fas fa-bolt mr-2"></i>ÉTAPE 2 : STRINGS
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Onduleurs</label>
                            <input type="number" id="inverterCount" min="0" max="50" value="1"
                                   class="w-full bg-black border border-gray-600 rounded px-3 py-2 text-center font-bold">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Boîtes Jonction (BJ)</label>
                            <input type="number" id="junctionBoxCount" min="0" max="100" value="0"
                                   class="w-full bg-black border border-gray-600 rounded px-3 py-2 text-center font-bold">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1">Nombre de Strings</label>
                            <input type="number" id="stringCount" min="1" max="50" value="2"
                                   class="w-full bg-black border border-gray-600 rounded px-3 py-2 text-center font-bold">
                        </div>
                        <button id="configureStringsBtn" class="w-full bg-yellow-600 hover:bg-yellow-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-sliders-h mr-1"></i>Configurer Strings
                        </button>
                        <div id="stringsSummary" class="p-2 bg-black rounded text-xs text-gray-400 hidden">
                            <div class="flex justify-between items-center mb-1">
                                <div class="font-bold text-yellow-400">Config actuelle:</div>
                                <button id="editStringsConfigBtn" class="bg-yellow-600 hover:bg-yellow-700 px-2 py-0.5 rounded text-xs font-bold text-white">
                                    <i class="fas fa-edit"></i> Modifier
                                </button>
                            </div>
                            <div id="stringsSummaryText">2 strings x 10 modules = 20 total</div>
                        </div>
                        <button id="saveConfigBtn" class="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-bold">
                            <i class="fas fa-check mr-1"></i>Sauvegarder Config
                        </button>
                    </div>
                </div>

                <!-- Étape 3 : Placement Modules -->
                <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-purple-400">
                        <i class="fas fa-solar-panel mr-2"></i>ÉTAPE 3 : PLACEMENT MODULES
                    </h3>
                    <div class="space-y-2">
                        <button id="drawRowBtn" class="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-draw-polygon mr-1"></i>Dessiner Rangée
                        </button>
                        <button id="placeManualBtn" class="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-mouse-pointer mr-1"></i>Placement Manuel
                        </button>
                        <button id="placeAutoBtn" class="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-magic mr-1"></i>Auto (Config)
                        </button>
                        <div class="flex gap-2 items-center pt-2">
                            <button id="rotateBtn" class="flex-1 bg-orange-600 hover:bg-orange-700 py-2 rounded font-bold text-sm">
                                <i class="fas fa-redo"></i>
                            </button>
                            <span id="rotationLabel" class="flex-1 px-3 py-2 bg-black rounded text-center font-bold">0°</span>
                        </div>
                        <button id="validateCalepinageBtn" class="w-full bg-green-600 hover:bg-green-700 py-2 rounded font-bold text-sm mt-3">
                            <i class="fas fa-check-circle mr-1"></i>Valider Calepinage
                        </button>
                        <button id="redistributeStringsBtn" class="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold text-sm mt-2">
                            <i class="fas fa-exchange-alt mr-1"></i>Redistribuer Strings
                        </button>
                        <button id="clearModulesBtn" class="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-bold text-sm mt-2">
                            <i class="fas fa-trash mr-1"></i>Effacer Modules
                        </button>
                    </div>
                </div>

                <!-- ÉTAPE 4 : Configuration Électrique -->
                <div class="bg-gray-900 rounded-lg border-2 border-yellow-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-yellow-400">
                        <i class="fas fa-plug mr-2"></i>ÉTAPE 4 : CONFIG ÉLECTRIQUE
                    </h3>
                    <div class="space-y-3">
                        <!-- Onduleurs -->
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs font-bold text-gray-300">🔌 Onduleurs</span>
                                <button id="addInverterBtn" class="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs font-bold">
                                    <i class="fas fa-plus mr-1"></i>Ajouter
                                </button>
                            </div>
                            <div id="invertersList" class="space-y-2 max-h-60 overflow-y-auto">
                                <p class="text-xs text-gray-500 text-center py-2">Aucun onduleur configuré</p>
                            </div>
                        </div>
                        
                        <!-- Validation -->
                        <div id="electricalValidation" class="bg-black rounded p-2 text-xs hidden">
                            <div class="font-bold text-yellow-400 mb-1">⚡ Validation</div>
                            <div id="validationWarnings" class="text-orange-400"></div>
                            <div id="validationErrors" class="text-red-400"></div>
                        </div>
                        
                        <button id="validateElectricalBtn" class="w-full bg-yellow-600 hover:bg-yellow-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-check-circle mr-1"></i>Valider Configuration
                        </button>
                    </div>
                </div>

                <!-- ÉTAPE 5 : Export GeoJSON/KML -->
                <div class="bg-gray-900 rounded-lg border-2 border-cyan-400 p-4">
                    <h3 class="text-lg font-black mb-3 text-cyan-400">
                        <i class="fas fa-download mr-2"></i>ÉTAPE 5 : EXPORT
                    </h3>
                    <div class="space-y-2">
                        <button id="exportGeoJsonBtn" class="w-full bg-cyan-600 hover:bg-cyan-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-map-marked-alt mr-1"></i>Export GeoJSON
                        </button>
                        <button id="exportKmlBtn" class="w-full bg-cyan-600 hover:bg-cyan-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-globe mr-1"></i>Export KML
                        </button>
                        <button id="exportCsvBtn" class="w-full bg-cyan-600 hover:bg-cyan-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-file-excel mr-1"></i>Export CSV
                        </button>
                        <div class="mt-2 p-2 bg-cyan-900 rounded text-xs text-cyan-200">
                            <i class="fas fa-info-circle mr-1"></i><strong>IEC 62446-1:</strong> Traçabilité GPS des modules
                        </div>
                    </div>
                </div>

                <!-- Stats Rapides -->
                <div class="bg-gray-900 rounded-lg border-2 border-blue-400 p-4">
                    <h3 class="text-sm font-black mb-2 text-blue-400">
                        <i class="fas fa-chart-bar mr-1"></i>STATS RAPIDES
                    </h3>
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Total:</span>
                            <span id="statsTotal" class="font-bold text-purple-400">0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>OK OK:</span>
                            <span id="statsOk" class="font-bold text-green-400">0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>HS Impact Cellulaire:</span>
                            <span id="statsDead" class="font-bold text-red-400">0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Pending Pending:</span>
                            <span id="statsPending" class="font-bold text-gray-400">0</span>
                        </div>
                    </div>
                </div>

                <!-- Aide Alignement Visuel -->
                <div id="alignmentHelp" class="bg-gradient-to-br from-orange-900 to-orange-800 rounded-lg border-2 border-orange-400 p-4 hidden">
                    <h3 class="text-sm font-black mb-2 text-orange-300">
                        <i class="fas fa-crosshairs mr-1"></i>Centre ALIGNEMENT VISUEL
                    </h3>
                    <div class="space-y-2 text-xs text-orange-100">
                        <div class="bg-black bg-opacity-40 p-2 rounded">
                            <div class="font-bold text-yellow-300 mb-1">🖱️ SÉLECTIONNER:</div>
                            <div>Cliquez sur le rectangle orange → Les poignées apparaissent</div>
                        </div>
                        <div class="bg-black bg-opacity-40 p-2 rounded">
                            <div class="font-bold text-orange-300 mb-1">📍 DÉPLACER:</div>
                            <div>Glissez le rectangle (drag & drop)</div>
                        </div>
                        <div class="bg-black bg-opacity-40 p-2 rounded">
                            <div class="font-bold text-orange-300 mb-1">️🔲 REDIMENSIONNER:</div>
                            <div>Glissez les 4 poignées blanches aux coins</div>
                        </div>
                        <div class="bg-black bg-opacity-40 p-2 rounded">
                            <div class="font-bold text-orange-300 mb-1">🔄 ROTATION:</div>
                            <div>Cliquez et glissez la poignée ↻ au centre</div>
                            <div class="text-xs text-orange-300 mt-1">Astuce: Maintenez Shift pour rotation libre</div>
                        </div>
                        <div class="bg-orange-500 text-black p-2 rounded font-bold text-center mt-3">
                            ⚡ Alignez avec la photo satellite !
                        </div>
                    </div>
                    <button id="hideAlignmentHelp" class="w-full bg-gray-700 hover:bg-gray-600 py-1 rounded text-xs mt-2">
                        Masquer
                    </button>
                </div>

                <!-- Synchronisation EL -->
                <div class="bg-gray-900 rounded-lg border-2 border-cyan-400 p-4">
                    <h3 class="text-sm font-black mb-2 text-cyan-400">
                        <i class="fas fa-sync-alt mr-1"></i>SYNC EL ️ CARTO
                    </h3>
                    <div class="space-y-2">
                        <button id="syncELBtn" class="w-full bg-cyan-600 hover:bg-cyan-700 py-2 rounded font-bold text-sm">
                            <i class="fas fa-sync-alt mr-1"></i>SYNCHRONISER MAINTENANT
                        </button>
                        <div id="syncStatus" class="text-xs p-2 bg-black rounded">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-gray-400">État:</span>
                                <span id="syncStatusText" class="font-bold text-gray-400">En attente</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-gray-400">Dernière sync:</span>
                                <span id="syncLastTime" class="font-bold text-gray-400">Jamais</span>
                            </div>
                        </div>
                        <label class="flex items-center gap-2 text-xs text-gray-400">
                            <input type="checkbox" id="autoSyncEnabled" checked class="w-4 h-4">
                            Auto-sync (30s)
                        </label>
                    </div>
                </div>

                <!-- Progression Strings (Visual Feedback) -->
                <div id="stringsProgressPanel" class="bg-gray-900 rounded-lg border-2 border-yellow-400 p-4 hidden">
                    <h3 class="text-sm font-black mb-3 text-yellow-400">
                        <i class="fas fa-tasks mr-1"></i>PROGRESSION STRINGS
                    </h3>
                    <div id="stringsProgressContainer" class="space-y-2">
                        <!-- Généré dynamiquement par updateStringsProgress() -->
                    </div>
                </div>
            </div>

            <!-- CENTER: Carte Leaflet -->
            <div class="col-span-3">
                <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-4 mb-4">
                    <div id="map"></div>
                </div>

                <!-- Stats Détaillées -->
                <div class="grid grid-cols-8 gap-3">
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-purple-400">
                        <div class="text-xl font-black text-purple-400" id="statsTotal2">0</div>
                        <div class="text-xs text-gray-400">Total</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-green-400">
                        <div class="text-xl font-black text-green-400" id="statsOk2">0</div>
                        <div class="text-xs">OK OK</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-yellow-400">
                        <div class="text-xl font-black text-yellow-400" id="statsInequality">0</div>
                        <div class="text-xs">Inegalite Inégal.</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-orange-400">
                        <div class="text-xl font-black text-orange-400" id="statsMicrocracks">0</div>
                        <div class="text-xs">Fissures Fissures</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-red-400">
                        <div class="text-xl font-black text-red-400" id="statsDead2">0</div>
                        <div class="text-xs">HS Impact Cellulaire</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-blue-400">
                        <div class="text-xl font-black text-blue-400" id="statsStringOpen">0</div>
                        <div class="text-xs">String String</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-gray-500">
                        <div class="text-xl font-black text-gray-400" id="statsNotConnected">0</div>
                        <div class="text-xs">Non-connecte NC</div>
                    </div>
                    <div class="bg-gray-900 rounded-lg p-3 text-center border border-gray-400">
                        <div class="text-xl font-black text-gray-400" id="statsPending2">0</div>
                        <div class="text-xs">Pending Pend.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Annotation Statut -->
        <div id="statusModal" class="hidden fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4" style="z-index: 10000;">
            <div class="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-md w-full">
                <h3 id="modalTitle" class="text-xl font-black mb-4 text-center">MODULE M000</h3>
                
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <button class="status-btn bg-green-600 hover:bg-green-700 p-3 rounded font-bold" data-status="ok">
                        OK OK<br><span class="text-sm font-normal">Aucun défaut</span>
                    </button>
                    <button class="status-btn bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold" data-status="inequality">
                        Inegalite Inégalité<br><span class="text-sm font-normal">Qualité cellules</span>
                    </button>
                    <button class="status-btn bg-orange-600 hover:bg-orange-700 p-3 rounded font-bold" data-status="microcracks">
                        Fissures Microfissures<br><span class="text-sm font-normal">Visibles EL</span>
                    </button>
                    <button class="status-btn bg-red-600 hover:bg-red-700 p-3 rounded font-bold" data-status="dead">
                        HS Impact Cellulaire<br><span class="text-sm font-normal">Défaillant</span>
                    </button>
                    <button class="status-btn bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold" data-status="string_open">
                        String String ouvert<br><span class="text-sm font-normal">Sous-string</span>
                    </button>
                    <button class="status-btn bg-gray-600 hover:bg-gray-700 p-3 rounded font-bold" data-status="not_connected">
                        Non-connecte Non raccordé<br><span class="text-sm font-normal">NC</span>
                    </button>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-bold mb-2">Commentaire :</label>
                    <input type="text" id="statusComment" 
                           class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2"
                           placeholder="Détails défaut...">
                </div>
                
                <div class="flex gap-3">
                    <button id="saveStatusBtn" class="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-black">
                        ENREGISTRER
                    </button>
                    <button id="cancelStatusBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Configuration Strings -->
        <div id="stringsModal" class="hidden fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4" style="z-index: 10000;">
            <div class="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <h3 class="text-xl font-black mb-4 text-center text-yellow-400">
                    <i class="fas fa-sliders-h mr-2"></i>CONFIGURATION STRINGS NON RÉGULIERS
                </h3>
                
                <div class="mb-4 p-3 bg-black rounded text-sm text-gray-400">
                    <i class="fas fa-info-circle mr-2 text-yellow-400"></i>
                    Configurez le nombre de modules pour chaque string individuellement (ex: String 1 = 26 modules, String 2 = 24 modules)
                </div>
                
                <div id="stringsConfigContainer" class="space-y-3 mb-4">
                    <!-- Généré dynamiquement par JS -->
                </div>
                
                <div class="p-3 bg-green-900/30 border border-green-400 rounded mb-4">
                    <div class="text-sm font-bold text-green-400">TOTAL MODULES</div>
                    <div id="totalModulesDisplay" class="text-3xl font-black text-green-400">0</div>
                </div>
                
                <div class="flex gap-3">
                    <button id="applyStringsConfigBtn" class="flex-1 bg-yellow-600 hover:bg-yellow-700 py-3 rounded font-black">
                        <i class="fas fa-check mr-2"></i>APPLIQUER
                    </button>
                    <button id="cancelStringsConfigBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        ANNULER
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Onduleur (Création/Édition) -->
        <div id="inverterModal" class="hidden fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4" style="z-index: 10000;">
            <div class="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <h3 class="text-xl font-black mb-4 text-center text-yellow-400">
                    <i class="fas fa-plug mr-2"></i><span id="inverterModalTitle">NOUVEL ONDULEUR</span>
                </h3>
                
                <form id="inverterForm" class="space-y-4">
                    <input type="hidden" id="inverterId" value="">
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold mb-2">Nom Onduleur *</label>
                            <input type="text" id="inverterName" required
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-yellow-400 focus:outline-none"
                                   placeholder="Onduleur 1">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">Puissance Nominale (kW) *</label>
                            <input type="number" id="inverterPower" required step="0.1" min="0"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-yellow-400 focus:outline-none"
                                   placeholder="100">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold mb-2">Marque</label>
                            <input type="text" id="inverterBrand"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-yellow-400 focus:outline-none"
                                   placeholder="Huawei, Fronius, SMA...">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">Modèle</label>
                            <input type="text" id="inverterModel"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-yellow-400 focus:outline-none"
                                   placeholder="SUN2000-100KTL">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold mb-2">Nombre MPPT</label>
                            <input type="number" id="inverterMppt" min="1" max="12" value="4"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-yellow-400 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">Rendement (%)</label>
                            <input type="number" id="inverterEfficiency" step="0.1" min="90" max="100" value="98"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-yellow-400 focus:outline-none">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Attribution Strings</label>
                        <div id="stringAssignmentContainer" class="bg-black rounded p-3 max-h-60 overflow-y-auto">
                            <p class="text-xs text-gray-500 text-center">Sélectionnez les strings à attribuer</p>
                            <div id="stringCheckboxes" class="grid grid-cols-4 gap-2 mt-2">
                                <!-- Généré dynamiquement -->
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Notes</label>
                        <textarea id="inverterNotes" rows="2"
                                  class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-yellow-400 focus:outline-none"
                                  placeholder="Notes techniques..."></textarea>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="flex-1 bg-yellow-600 hover:bg-yellow-700 py-3 rounded font-black">
                            <i class="fas fa-save mr-2"></i>ENREGISTRER
                        </button>
                        <button type="button" id="cancelInverterBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                            ANNULER
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal Import depuis Module EL -->
        <div id="importELModal" class="hidden fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4" style="z-index: 10000;">
            <div class="bg-gray-900 border-2 border-purple-400 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <h3 class="text-2xl font-black mb-4 text-center text-purple-400">
                    <i class="fas fa-file-import mr-2"></i>IMPORTER CONFIGURATION DEPUIS MODULE EL
                </h3>
                
                <div class="mb-4 p-3 bg-purple-900/30 border border-purple-400 rounded text-sm">
                    <i class="fas fa-info-circle mr-2 text-purple-400"></i>
                    <strong>Sélectionnez un audit EL</strong> pour importer automatiquement la configuration des rectangles de modules (nombre, dimensions, disposition).
                </div>
                
                <!-- Liste des audits disponibles -->
                <div id="auditListContainer" class="space-y-2 mb-4 max-h-96 overflow-y-auto">
                    <div class="text-center py-8 text-gray-400">
                        <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                        <p>Chargement des audits EL...</p>
                    </div>
                </div>
                
                <div class="flex gap-3 pt-4 border-t border-gray-700">
                    <button id="cancelImportELBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                        <i class="fas fa-times mr-2"></i>ANNULER
                    </button>
                </div>
            </div>
        </div>

        <script>
        // ================================================================
        // VARIABLES GLOBALES
        // ================================================================
        const plantId = '${plantId}'
        const zoneId = '${zoneId}'
        
        let map = null
        let drawnItems = new L.FeatureGroup()
        let roofPolygon = null
        let roofArea = 0
        let modules = []
        let plantData = null
        let zoneData = null
        let currentRotation = 0
        let selectedModule = null
        let placementMode = "manual"
        let drawControl = null
        let nextModuleNum = 1
        let stringsConfig = [] // Configuration strings non réguliers: [{stringNum: 1, modulesCount: 26}, ...] - v2.1
        
        // Variables pour dessin rangée drag & drop
        let isDrawingRow = false
        let rowStartLatLng = null
        let rowPreviewRect = null
        
        // Variables pour structures (bâtiments/ombrières/champs) - NOUVEAU
        let structures = [] // Array de structures: {id, type, name, layer, area}
        let structuresLayer = new L.FeatureGroup() // Calque structures (sous modules)
        let currentDrawingStructureType = null // Type structure en cours de dessin
        let structureDrawControl = null // Contrôle dessin Leaflet
        
        // Variables pour rectangles modules (SolarEdge style)
        let moduleRectangles = [] // Array de RectangleModuleGroup
        let showModules = false       // Affichage modules désactivé par défaut (nouveau)
        let showRectGrid = true       // Grille activée par défaut (aide alignement)
        let showRectLabels = false    // Labels désactivés par défaut
        let showRectInfo = false      // Info overlay désactivé par défaut
        let persistentEditMode = false  // Mode édition persistante (handles toujours actifs)
        let liveRotationPreview = true  // Aperçu modules pendant rotation
        
        // Variables pour configuration électrique (onduleurs + strings) - NOUVEAU
        let inverters = [] // Array d'onduleurs: {id, inverter_name, rated_power_kw, ...}
        let currentEditingInverter = null // Onduleur en cours d'édition (null = création)
        
        const STATUS_COLORS = {
            ok: "#22c55e",
            inequality: "#eab308",
            microcracks: "#f97316",
            dead: "#ef4444",
            string_open: "#3b82f6",
            not_connected: "#6b7280",
            pending: "#e5e7eb"
        }
        
        // ================================================================
        // CLASSE RECTANGLE MODULE GROUP (SOLAREDGE STYLE)
        // ================================================================
        class RectangleModuleGroup {
            constructor(id, rows, cols, stringStart, initialBounds) {
                this.id = id
                this.rows = rows
                this.cols = cols
                this.stringStart = stringStart
                this.modules = []
                this.gridLines = []
                this.infoMarker = null
                this.handles = {
                    nw: null,  // Nord-Ouest (haut-gauche)
                    ne: null,  // Nord-Est (haut-droite)
                    sw: null,  // Sud-Ouest (bas-gauche)
                    se: null,  // Sud-Est (bas-droite)
                    rotate: null  // Centre (rotation)
                }
                this.isRotating = false
                this.rotationStartAngle = 0
                this.rotationCenter = null
                this.currentRotation = 0
                this.rotatedPolygon = null
                this.angleIndicator = null  // Indicateur angle pendant rotation
                
                // NOUVEAU: Stocker centre et dimensions ORIGINALES (avant rotation)
                // Pour rotation rigide sans déformation trapèze
                const bounds = L.latLngBounds(initialBounds)
                this.originalCenter = bounds.getCenter()  // Centre GPS original
                this.originalBounds = bounds  // Bounds complets originaux
                
                // CRITIQUE: Stocker dimensions rectangle EN PIXELS (système cartésien pur)
                // Calculé une seule fois à la création, jamais recalculé depuis GPS
                const nwPixel = map.latLngToContainerPoint(bounds.getNorthWest())
                const sePixel = map.latLngToContainerPoint(bounds.getSouthEast())
                this.originalWidthPixels = Math.abs(sePixel.x - nwPixel.x)
                this.originalHeightPixels = Math.abs(sePixel.y - nwPixel.y)
                
                console.log("📐 Dimensions originales:", this.originalWidthPixels.toFixed(1) + "px x " + this.originalHeightPixels.toFixed(1) + "px")
                
                // Créer rectangle Leaflet EDITABLE avec semi-transparence
                this.rectangle = L.rectangle(initialBounds, {
                    color: "#f59e0b",
                    weight: 3,
                    opacity: 0.8,
                    fillColor: "#f59e0b",
                    fillOpacity: 0.15,
                    className: "module-rectangle-" + this.id,
                    interactive: true,  // CRITIQUE: Permettre les clics
                    bubblingMouseEvents: true  // Permettre la propagation pour le drag
                })
                
                // Effet visuel au survol pour indiquer que c'est cliquable
                this.rectangle.on('mouseover', (e) => {
                    if (!this.isRotating) {
                        this.rectangle.setStyle({ weight: 5, opacity: 1, cursor: 'pointer' })
                        console.log("👆 Survol rectangle ID:", this.id)
                    }
                })
                
                this.rectangle.on('mouseout', () => {
                    if (!this.handles.nw || !map.hasLayer(this.handles.nw)) {
                        this.rectangle.setStyle({ weight: 3, opacity: 0.8 })
                    }
                })
                
                // Stocker les variables de drag dans l'instance pour y accéder depuis setupDragEvents()
                this.isDragging = false
                this.dragPrepared = false
                this.dragStartLatLng = null
                this.dragStartBounds = null
                
                // Configurer les events de drag (sera aussi appelé après restauration)
                this.setupDragEvents()
                
                // Event listeners pour édition
                this.rectangle.on('dragstart', () => {
                    // Désactiver interactions carte pendant déplacement rectangle
                    map.dragging.disable()
                    map.doubleClickZoom.disable()
                    map.scrollWheelZoom.disable()
                })
                
                this.rectangle.on('dragend', () => {
                    // Réactiver interactions carte après déplacement
                    map.dragging.enable()
                    map.doubleClickZoom.enable()
                    map.scrollWheelZoom.enable()
                    
                    // IMPORTANT: Mettre à jour centre ET dimensions après drag
                    const newBounds = this.rectangle.getBounds()
                    this.originalCenter = newBounds.getCenter()
                    this.originalBounds = newBounds
                    
                    // Recalculer dimensions pixel
                    const nwPixel = map.latLngToContainerPoint(newBounds.getNorthWest())
                    const sePixel = map.latLngToContainerPoint(newBounds.getSouthEast())
                    this.originalWidthPixels = Math.abs(sePixel.x - nwPixel.x)
                    this.originalHeightPixels = Math.abs(sePixel.y - nwPixel.y)
                    
                    this.regenerateModules()
                    applyRectanglesToModules()
                })
                
                this.rectangle.on('edit', () => {
                    this.regenerateModules()
                    applyRectanglesToModules()
                })
                
                // Ajouter popup avec contrôles
                const popupContent = '<div class="p-3 bg-gray-900 text-white rounded">' +
                    '<h3 class="font-bold text-lg mb-2 text-blue-400">Rectangle #' + this.id + '</h3>' +
                    '<p class="text-sm mb-2">' + this.rows + ' lignes x ' + this.cols + ' colonnes = <strong>' + (this.rows * this.cols) + ' modules</strong></p>' +
                    '<p class="text-xs text-gray-400 mb-3">Strings ' + this.stringStart + '-' + (this.stringStart + Math.floor((this.rows * this.cols - 1) / 24)) + '</p>' +
                    '<div class="space-y-2">' +
                        '<button onclick="resetRectangleRotation(' + this.id + ')" class="w-full bg-orange-600 hover:bg-orange-700 py-2 px-3 rounded text-sm font-bold">' +
                            '<i class="fas fa-undo mr-1"></i>Réinitialiser Rotation' +
                        '</button>' +
                        '<button onclick="duplicateRectangle(' + this.id + ')" class="w-full bg-green-600 hover:bg-green-700 py-2 px-3 rounded text-sm font-bold">' +
                            '<i class="fas fa-copy mr-1"></i>Dupliquer' +
                        '</button>' +
                        '<button onclick="deleteRectangle(' + this.id + ')" class="w-full bg-red-600 hover:bg-red-700 py-2 px-3 rounded text-sm font-bold">' +
                            '<i class="fas fa-trash mr-1"></i>Supprimer' +
                        '</button>' +
                    '</div>' +
                    '<div class="mt-3 p-2 bg-gray-800 rounded text-xs text-gray-400">' +
                        '<p class="font-bold text-blue-400 mb-1">💡 Mode édition:</p>' +
                        '<p>• Clic rectangle → handles apparaissent</p>' +
                        '<p>• Drag coins blancs → resize</p>' +
                        '<p>• Drag centre bleu → rotation</p>' +
                    '</div>' +
                    '</div>'
                
                this.rectangle.bindPopup(popupContent, {
                    maxWidth: 300,
                    className: 'rectangle-controls-popup'
                })
                
                // Générer modules initiaux
                this.regenerateModules()
            }
            
            regenerateModules() {
                console.log(" Régénération modules rectangle", this.id)
                
                // Clear old modules/grid
                this.clearVisuals()
                
                // ================================================================
                // ROTATION RIGIDE: Utiliser CENTRE ORIGINAL (pas trapèze déformé)
                // ================================================================
                
                // Toujours utiliser centre original stocké (avant rotation)
                const centerLat = this.originalCenter.lat
                const centerLng = this.originalCenter.lng
                
                console.log("✅ Centre rigide:", centerLat.toFixed(6), centerLng.toFixed(6), "| Rotation:", this.currentRotation + "°")
                
                // Calculer dimensions réelles du module en coordonnées GPS
                const zoom = map.getZoom()
                
                // Formule Leaflet: mètres par pixel
                const metersPerPixel = 156543.03392 * Math.cos(centerLat * Math.PI / 180) / Math.pow(2, zoom)
                const pixelsPerMeter = 1 / metersPerPixel
                
                // Dimensions module en pixels
                const moduleWidthPixels = 1.7 * pixelsPerMeter
                const moduleHeightPixels = 1.0 * pixelsPerMeter
                
                console.log("Tech Module:", moduleWidthPixels.toFixed(1) + "px x " + moduleHeightPixels.toFixed(1) + "px")
                
                // NOUVEAU: Generate grid avec rotation RIGIDE (pas de déformation)
                // Utiliser angle de rotation RÉEL stocké (pas les coords GPS déformées)
                const rotationAngle = (this.currentRotation || 0) * (Math.PI / 180)  // Convertir degrés → radians
                
                console.log("🔄 Rotation rigide:", this.currentRotation + "° = " + rotationAngle.toFixed(3) + " rad")
                
                this.modules = []
                let globalPosition = 0
                
                // Centre du rectangle en pixels (calculé UNE FOIS hors boucle)
                const rectCenterPoint = map.latLngToContainerPoint([centerLat, centerLng])
                
                // CRITIQUE: Recalculer dimensions pixel depuis bounds originaux AU ZOOM ACTUEL
                // (originalWidthPixels/Height peuvent être obsolètes si zoom a changé)
                const currentNWPixel = map.latLngToContainerPoint(this.originalBounds.getNorthWest())
                const currentSEPixel = map.latLngToContainerPoint(this.originalBounds.getSouthEast())
                const currentWidthPixels = Math.abs(currentSEPixel.x - currentNWPixel.x)
                const currentHeightPixels = Math.abs(currentSEPixel.y - currentNWPixel.y)
                
                // Calculer espacement entre modules depuis dimensions totales
                const gridCellWidth = currentWidthPixels / this.cols
                const gridCellHeight = currentHeightPixels / this.rows
                
                console.log("📊 Grille:", gridCellWidth.toFixed(1) + "px x " + gridCellHeight.toFixed(1) + "px par cellule (zoom=" + map.getZoom() + ")")
                
                // Précalcul cos/sin pour rotation (optimisation)
                const cos = Math.cos(rotationAngle)
                const sin = Math.sin(rotationAngle)
                
                for (let row = 0; row < this.rows; row++) {
                    for (let col = 0; col < this.cols; col++) {
                        const currentString = this.stringStart + Math.floor(globalPosition / 24)
                        const positionInString = (globalPosition % 24) + 1
                        // ROTATION RIGIDE EN PIXEL PUR - Utilise dimensions RECTANGLE
                        // Position relative du module dans grille NON pivotée (0,0 = centre)
                        const relX = (col - (this.cols - 1) / 2) * gridCellWidth
                        const relY = (row - (this.rows - 1) / 2) * gridCellHeight
                        
                        // Rotation 2D pure autour centre rectangle
                        const rotatedX = rectCenterPoint.x + (relX * cos - relY * sin)
                        const rotatedY = rectCenterPoint.y + (relX * sin + relY * cos)
                        
                        // CRITIQUE: Dimensions module = dimensions cellule grille (pas dimensions physiques)
                        const halfWidth = gridCellWidth / 2
                        const halfHeight = gridCellHeight / 2
                        
                        // Les 4 coins du module NON pivoté
                        const corners = [
                            { x: -halfWidth, y: -halfHeight },  // Top-left
                            { x: +halfWidth, y: -halfHeight },  // Top-right
                            { x: +halfWidth, y: +halfHeight },  // Bottom-right
                            { x: -halfWidth, y: +halfHeight }   // Bottom-left
                        ]
                        
                        // Appliquer rotation aux 4 coins
                        const rotatedCorners = corners.map(corner => ({
                            x: rotatedX + (corner.x * cos - corner.y * sin),
                            y: rotatedY + (corner.x * sin + corner.y * cos)
                        }))
                        
                        // Convertir centre module en GPS
                        const moduleCenter = map.containerPointToLatLng([rotatedX, rotatedY])
                        const moduleCenterLat = moduleCenter.lat
                        const moduleCenterLng = moduleCenter.lng
                        
                        // Convertir LES 4 COINS en GPS (pour polygon pivoté)
                        const moduleCornerNW = map.containerPointToLatLng([rotatedCorners[0].x, rotatedCorners[0].y])
                        const moduleCornerNE = map.containerPointToLatLng([rotatedCorners[1].x, rotatedCorners[1].y])
                        const moduleCornerSE = map.containerPointToLatLng([rotatedCorners[2].x, rotatedCorners[2].y])
                        const moduleCornerSW = map.containerPointToLatLng([rotatedCorners[3].x, rotatedCorners[3].y])
                        
                        this.modules.push({
                            id: null,
                            zone_id: parseInt(zoneId),
                            module_identifier: "S" + currentString + "-P" + (positionInString < 10 ? '0' : '') + positionInString,
                            latitude: moduleCenterLat,
                            longitude: moduleCenterLng,
                            pos_x_meters: col * 1.7,
                            pos_y_meters: row * 1.0,
                            width_meters: 1.7,
                            height_meters: 1.0,
                            rotation: this.currentRotation || 0,  // Stocker angle rotation
                            string_number: currentString,
                            position_in_string: positionInString,
                            power_wp: 450,
                            module_status: "pending",
                            status_comment: null,
                            rectangleId: this.id,
                            // CRITIQUE: Stocker les 4 coins pour polygon pivoté
                            moduleCorners: [
                                [moduleCornerNW.lat, moduleCornerNW.lng],
                                [moduleCornerNE.lat, moduleCornerNE.lng],
                                [moduleCornerSE.lat, moduleCornerSE.lng],
                                [moduleCornerSW.lat, moduleCornerSW.lng]
                            ]
                        })
                        
                        globalPosition++
                    }
                }
                
                // Draw grid if enabled
                if (showRectGrid) {
                    this.drawGrid()
                }
                
                // Update info overlay
                if (showRectInfo) {
                    this.updateInfoOverlay()
                }
                
                console.log("✅ Rectangle", this.id, ":", this.modules.length, "modules générés avec dimensions réelles")
            }
            
            drawGrid() {
                // CRITIQUE: Utiliser rotatedPolygon si existe (rectangle pivoté)
                // Sinon utiliser bounds rectangle normal
                let nw, ne, sw, se
                
                if (this.rotatedPolygon) {
                    // Rectangle pivoté → utiliser coins polygon (déjà en pixel pur)
                    const coords = this.rotatedPolygon.getLatLngs()[0]
                    nw = coords[0]  // Nord-Ouest
                    ne = coords[1]  // Nord-Est
                    se = coords[2]  // Sud-Est
                    sw = coords[3]  // Sud-Ouest
                } else {
                    // Rectangle normal → utiliser bounds classiques
                    const bounds = this.rectangle.getBounds()
                    nw = bounds.getNorthWest()
                    ne = bounds.getNorthEast()
                    sw = bounds.getSouthWest()
                    se = bounds.getSouthEast()
                }
                
                // Horizontal lines
                for (let i = 0; i <= this.rows; i++) {
                    const ratio = this.rows > 0 ? i / this.rows : 0
                    
                    const startLat = nw.lat + (sw.lat - nw.lat) * ratio
                    const startLng = nw.lng + (sw.lng - nw.lng) * ratio
                    
                    const endLat = ne.lat + (se.lat - ne.lat) * ratio
                    const endLng = ne.lng + (se.lng - ne.lng) * ratio
                    
                    const line = L.polyline([[startLat, startLng], [endLat, endLng]], {
                        color: "#ffffff",
                        weight: 2,
                        opacity: 0.9,
                        className: "rectangle-grid-line",
                        interactive: false
                    })
                    
                    line.addTo(drawnItems)
                    this.gridLines.push(line)
                }
                
                // Vertical lines
                for (let i = 0; i <= this.cols; i++) {
                    const ratio = this.cols > 0 ? i / this.cols : 0
                    
                    const startLat = nw.lat + (ne.lat - nw.lat) * ratio
                    const startLng = nw.lng + (ne.lng - nw.lng) * ratio
                    
                    const endLat = sw.lat + (se.lat - sw.lat) * ratio
                    const endLng = sw.lng + (se.lng - sw.lng) * ratio
                    
                    const line = L.polyline([[startLat, startLng], [endLat, endLng]], {
                        color: "#ffffff",
                        weight: 2,
                        opacity: 0.9,
                        className: "rectangle-grid-line",
                        interactive: false
                    })
                    
                    line.addTo(drawnItems)
                    this.gridLines.push(line)
                }
            }
            
            updateInfoOverlay() {
                if (this.infoMarker) {
                    drawnItems.removeLayer(this.infoMarker)
                }
                
                const center = this.rectangle.getBounds().getCenter()
                const totalModules = this.rows * this.cols
                const powerKwc = (totalModules * 0.45).toFixed(2)
                const stringEnd = this.stringStart + Math.floor((totalModules - 1) / 24)
                
                const html = '<div class="rectangle-info-overlay">' +
                    '<strong>' + this.rows + " lignes x " + this.cols + " modules</strong><br>" +
                    'Strings ' + this.stringStart + "-" + stringEnd + " | " + totalModules + " modules<br>" +
                    powerKwc + " kWc | Rectangle #" + this.id +
                    '</div>'
                
                this.infoMarker = L.marker(center, {
                    icon: L.divIcon({
                        className: "rectangle-info-marker",
                        html: html,
                        iconSize: [200, 60],
                        iconAnchor: [100, 30]
                    }),
                    interactive: false
                })
                
                this.infoMarker.addTo(drawnItems)
            }
            
            clearVisuals() {
                // Remove grid lines
                this.gridLines.forEach(line => drawnItems.removeLayer(line))
                this.gridLines = []
                
                // Remove info marker
                if (this.infoMarker) {
                    drawnItems.removeLayer(this.infoMarker)
                    this.infoMarker = null
                }
            }
            
            setupDragEvents() {
                // Configuration des events de drag & drop
                // Peut être appelé plusieurs fois (création + restauration)
                
                // Supprimer les anciens events pour éviter les doublons
                this.rectangle.off('mousedown')
                
                this.rectangle.on('mousedown', (e) => {
                    // Clic gauche UNIQUEMENT si pas en rotation
                    if (!this.isRotating && e.originalEvent.button === 0) {
                        // Préparer le drag MAIS ne pas encore activer isDragging
                        // On active seulement après déplacement de 10+ pixels (évite drag accidentel)
                        this.dragPrepared = true
                        this.dragStartPixel = map.latLngToContainerPoint(e.latlng)
                        this.dragStartBounds = this.rectangle.getBounds()
                        // Sauvegarder corners du polygon si rotation active
                        if (this.rotatedPolygon && map.hasLayer(this.rotatedPolygon)) {
                            this.dragStartPolygonCorners = this.rotatedPolygon.getLatLngs()[0].map(ll => ({lat: ll.lat, lng: ll.lng}))
                        }
                        L.DomEvent.stopPropagation(e.originalEvent)
                        L.DomEvent.preventDefault(e.originalEvent)
                        console.log("🖱️ Préparation drag rectangle ID:", this.id)
                    }
                })
            }
            
            setupMapDragEvents() {
                // Events globaux sur la carte pour le drag
                // Ces events sont partagés entre tous les rectangles
                if (!window.rectangleDragEventsSetup) {
                    window.rectangleDragEventsSetup = true
                    
                    map.on('mousemove', (e) => {
                        // Trouver le rectangle préparé ou en cours de drag
                        const draggingRect = moduleRectangles.find(r => r.isDragging || r.dragPrepared)
                        if (draggingRect && draggingRect.dragStartPixel && draggingRect.dragStartBounds) {
                            // CORRECTION: Calculer différence en PIXELS (stable et linéaire)
                            const currentPixel = map.latLngToContainerPoint(e.latlng)
                            const pixelDiffX = currentPixel.x - draggingRect.dragStartPixel.x
                            const pixelDiffY = currentPixel.y - draggingRect.dragStartPixel.y
                            
                            // SEUIL: Activer drag seulement après 10 pixels de déplacement
                            const distance = Math.sqrt(pixelDiffX * pixelDiffX + pixelDiffY * pixelDiffY)
                            if (!draggingRect.isDragging && distance < 10) {
                                // Pas encore assez bougé, ignorer
                                return
                            }
                            
                            // Activer le drag maintenant
                            if (!draggingRect.isDragging) {
                                draggingRect.isDragging = true
                                draggingRect.dragPrepared = false
                                map.dragging.disable()
                                console.log("✅ Drag activé (seuil 10px atteint)")
                            }
                            
                            // Convertir bounds initiaux en pixels
                            const nw = draggingRect.dragStartBounds.getNorthWest()
                            const se = draggingRect.dragStartBounds.getSouthEast()
                            const nwPixel = map.latLngToContainerPoint(nw)
                            const sePixel = map.latLngToContainerPoint(se)
                            
                            // Appliquer offset en pixels
                            const newNwPixel = L.point(nwPixel.x + pixelDiffX, nwPixel.y + pixelDiffY)
                            const newSePixel = L.point(sePixel.x + pixelDiffX, sePixel.y + pixelDiffY)
                            
                            // Reconvertir en lat/lng
                            const newNw = map.containerPointToLatLng(newNwPixel)
                            const newSe = map.containerPointToLatLng(newSePixel)
                            const newBounds = L.latLngBounds(newNw, newSe)
                            
                            draggingRect.rectangle.setBounds(newBounds)
                            
                            // CRITIQUE: Si rotation active, mettre à jour aussi le rotatedPolygon
                            if (draggingRect.rotatedPolygon && map.hasLayer(draggingRect.rotatedPolygon)) {
                                // CORRECTION: Utiliser corners INITIAUX sauvegardés (pas actuels qui changent à chaque frame)
                                const corners = draggingRect.dragStartPolygonCorners || draggingRect.rotatedPolygon.getLatLngs()[0]
                                const newCorners = corners.map(corner => {
                                    const cornerPixel = map.latLngToContainerPoint(corner)
                                    const newCornerPixel = L.point(cornerPixel.x + pixelDiffX, cornerPixel.y + pixelDiffY)
                                    return map.containerPointToLatLng(newCornerPixel)
                                })
                                draggingRect.rotatedPolygon.setLatLngs(newCorners)
                            }
                            
                            // Mettre à jour les handles si ils existent
                            if (draggingRect.handles.nw && map.hasLayer(draggingRect.handles.nw)) {
                                draggingRect.updateHandles()
                            }
                        }
                    })
                    
                    map.on('mouseup', () => {
                        // Trouver le rectangle préparé ou en cours de drag
                        const draggingRect = moduleRectangles.find(r => r.isDragging || r.dragPrepared)
                        if (draggingRect) {
                            if (draggingRect.isDragging) {
                                // Drag effectif: sauvegarder position
                                draggingRect.isDragging = false
                                map.dragging.enable()
                                
                                // Mettre à jour position finale
                                const newBounds = draggingRect.rectangle.getBounds()
                                draggingRect.originalCenter = newBounds.getCenter()
                                draggingRect.originalBounds = newBounds
                                
                                // Régénérer modules
                                draggingRect.regenerateModules()
                                saveRectanglesConfig()
                                
                                console.log("✅ Rectangle déplacé:", draggingRect.originalCenter.lat.toFixed(6), draggingRect.originalCenter.lng.toFixed(6))
                            } else {
                                // Juste un clic sans drag: annuler
                                draggingRect.dragPrepared = false
                                console.log("🖱️ Clic simple (pas de drag)")
                            }
                        }
                    })
                    
                    // Désélection au clic sur la carte
                    map.on('click', (e) => {
                        // Si on clique sur la carte (pas sur un rectangle)
                        console.log("🗺️ Clic sur la carte - désélection tous rectangles")
                        // CRITIQUE: Vérifier que rectangle existe avant appel hideHandles()
                        moduleRectangles.forEach(rect => {
                            if (rect.rectangle) {
                                rect.hideHandles()
                            }
                        })
                    })
                    
                    console.log("✅ Events globaux drag configurés (une seule fois)")
                }
            }
            
            addToMap() {
                // Ajouter directement à la carte ET à drawnItems
                this.rectangle.addTo(map)
                drawnItems.addLayer(this.rectangle)
                
                // Forcer z-index élevé pour être au-dessus de tout
                this.rectangle.bringToFront()
                
                console.log("➕ Rectangle ajouté à la carte, ID:", this.id, "- Visible:", map.hasLayer(this.rectangle))
                
                if (showRectGrid) this.drawGrid()
                if (showRectInfo) this.updateInfoOverlay()
                
                // Configurer les events globaux de drag (une seule fois)
                this.setupMapDragEvents()
                
                // Event listener pour SÉLECTION au clic
                const selectRectangle = (e) => {
                    console.log("🎯 Rectangle sélectionné, ID:", this.id)
                    
                    // Empêcher propagation vers la carte
                    if (e && e.originalEvent) {
                        L.DomEvent.stopPropagation(e.originalEvent)
                    }
                    
                    // Désactiver handles des autres rectangles
                    moduleRectangles.forEach(rect => {
                        if (rect.id !== this.id && rect.rectangle) {
                            rect.hideHandles()
                        }
                    })
                    
                    // Activer handles de ce rectangle
                    this.showHandles()
                }
                
                // Click pour sélection
                this.rectangle.on('click', selectRectangle)
            }
            
            removeFromMap() {
                // CRITIQUE: Cacher handles AVANT de mettre rectangle à null
                this.hideHandles()
                this.clearVisuals()
                
                // Supprimer le rectangle principal
                if (this.rectangle) {
                    drawnItems.removeLayer(this.rectangle)
                    this.rectangle = null
                }
                
                // Nettoyer polygon rotatif si existe
                if (this.rotatedPolygon) {
                    drawnItems.removeLayer(this.rotatedPolygon)
                    this.rotatedPolygon = null
                }
            }
            
            destroy() {
                this.removeFromMap()
                this.modules = []
            }
            
            // ================================================================
            // HANDLES INTERACTIFS (DRAG/RESIZE/ROTATE)
            // ================================================================
            
            // Helper: Retourner les bounds corrects (rotatedPolygon si rotation active, sinon rectangle)
            // CRITIQUE: Retourner null si aucune shape valide (après suppression)
            getVisibleShape() {
                if (this.rotatedPolygon && map.hasLayer(this.rotatedPolygon)) {
                    return this.rotatedPolygon
                }
                return this.rectangle || null
            }
            
            createHandles() {
                // CRITIQUE: Vérifier que shape existe (protection null après suppression)
                const shape = this.getVisibleShape()
                if (!shape) {
                    console.warn("⚠️ createHandles() appelé sur rectangle supprimé, ID:", this.id)
                    return
                }
                
                const bounds = shape.getBounds()
                const center = bounds.getCenter()
                const nw = bounds.getNorthWest()
                const ne = bounds.getNorthEast()
                const sw = bounds.getSouthWest()
                const se = bounds.getSouthEast()
                
                // Icône pour handles de resize (coins)
                const resizeIcon = L.divIcon({
                    className: 'resize-handle',
                    html: '',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                })
                
                // Icône pour handle de rotation (centre)
                const rotateIcon = L.divIcon({
                    className: 'rotation-handle',
                    html: '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;">↻</div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
                
                // Créer handles de resize pour chaque coin
                this.handles.nw = L.marker(nw, { 
                    icon: resizeIcon, 
                    draggable: true,
                    zIndexOffset: 1000
                })
                this.handles.ne = L.marker(ne, { 
                    icon: resizeIcon, 
                    draggable: true,
                    zIndexOffset: 1000
                })
                this.handles.sw = L.marker(sw, { 
                    icon: resizeIcon, 
                    draggable: true,
                    zIndexOffset: 1000
                })
                this.handles.se = L.marker(se, { 
                    icon: resizeIcon, 
                    draggable: true,
                    zIndexOffset: 1000
                })
                
                // Créer handle de rotation au centre
                this.handles.rotate = L.marker(center, { 
                    icon: rotateIcon, 
                    draggable: false,
                    zIndexOffset: 1001
                })
                
                // Event listeners pour resize (drag des coins)
                // Désactiver carte au début du drag
                this.handles.nw.on('dragstart', () => { map.dragging.disable(); map.doubleClickZoom.disable(); map.scrollWheelZoom.disable() })
                this.handles.ne.on('dragstart', () => { map.dragging.disable(); map.doubleClickZoom.disable(); map.scrollWheelZoom.disable() })
                this.handles.sw.on('dragstart', () => { map.dragging.disable(); map.doubleClickZoom.disable(); map.scrollWheelZoom.disable() })
                this.handles.se.on('dragstart', () => { map.dragging.disable(); map.doubleClickZoom.disable(); map.scrollWheelZoom.disable() })
                
                this.handles.nw.on('drag', (e) => this.onCornerDrag('nw', e.target.getLatLng()))
                this.handles.ne.on('drag', (e) => this.onCornerDrag('ne', e.target.getLatLng()))
                this.handles.sw.on('drag', (e) => this.onCornerDrag('sw', e.target.getLatLng()))
                this.handles.se.on('drag', (e) => this.onCornerDrag('se', e.target.getLatLng()))
                
                // Event listeners pour rotation (clic + move souris)
                this.handles.rotate.on('mousedown', (e) => this.onRotationStart(e))
                
                // Réactiver carte à la fin du drag
                this.handles.nw.on('dragend', () => { map.dragging.enable(); map.doubleClickZoom.enable(); map.scrollWheelZoom.enable(); this.onTransformEnd() })
                this.handles.ne.on('dragend', () => { map.dragging.enable(); map.doubleClickZoom.enable(); map.scrollWheelZoom.enable(); this.onTransformEnd() })
                this.handles.sw.on('dragend', () => { map.dragging.enable(); map.doubleClickZoom.enable(); map.scrollWheelZoom.enable(); this.onTransformEnd() })
                this.handles.se.on('dragend', () => { map.dragging.enable(); map.doubleClickZoom.enable(); map.scrollWheelZoom.enable(); this.onTransformEnd() })
                
                console.log("✅ Handles créés pour rectangle", this.id)
            }
            
            updateHandles() {
                if (!this.handles.nw) return
                
                // CRITIQUE: Vérifier que shape existe (protection null après suppression)
                const shape = this.getVisibleShape()
                if (!shape) {
                    console.warn("⚠️ updateHandles() appelé sur rectangle supprimé, ID:", this.id)
                    return
                }
                
                const bounds = shape.getBounds()
                const center = bounds.getCenter()
                const nw = bounds.getNorthWest()
                const ne = bounds.getNorthEast()
                const sw = bounds.getSouthWest()
                const se = bounds.getSouthEast()
                
                this.handles.nw.setLatLng(nw)
                this.handles.ne.setLatLng(ne)
                this.handles.sw.setLatLng(sw)
                this.handles.se.setLatLng(se)
                this.handles.rotate.setLatLng(center)
            }
            
            showHandles() {
                // CRITIQUE: Vérifier que rectangle existe (protection null après suppression)
                if (!this.rectangle) {
                    console.warn("⚠️ showHandles() appelé sur rectangle supprimé, ID:", this.id)
                    return
                }
                
                if (!this.handles.nw) {
                    this.createHandles()
                }
                
                // Vérifier à nouveau après createHandles (peut avoir échoué)
                if (!this.handles.nw) return
                
                this.handles.nw.addTo(map)
                this.handles.ne.addTo(map)
                this.handles.sw.addTo(map)
                this.handles.se.addTo(map)
                this.handles.rotate.addTo(map)
                
                // Mettre surbrillance sur rectangle sélectionné
                this.rectangle.setStyle({ weight: 6, color: '#f59e0b' })
            }
            
            hideHandles() {
                if (this.handles.nw) {
                    map.removeLayer(this.handles.nw)
                    map.removeLayer(this.handles.ne)
                    map.removeLayer(this.handles.sw)
                    map.removeLayer(this.handles.se)
                    map.removeLayer(this.handles.rotate)
                }
                
                // CRITIQUE: Vérifier que rectangle existe avant setStyle (protection null après suppression)
                if (this.rectangle) {
                    this.rectangle.setStyle({ weight: 4, color: '#3b82f6' })
                }
            }
            
            onCornerDrag(corner, newLatLng) {
                const bounds = this.rectangle.getBounds()
                const nw = bounds.getNorthWest()
                const ne = bounds.getNorthEast()
                const sw = bounds.getSouthWest()
                const se = bounds.getSouthEast()
                
                let newBounds
                
                // Mettre à jour bounds selon coin déplacé
                switch(corner) {
                    case 'nw':
                        newBounds = L.latLngBounds(newLatLng, se)
                        break
                    case 'ne':
                        newBounds = L.latLngBounds([newLatLng.lat, sw.lng], [sw.lat, newLatLng.lng])
                        break
                    case 'sw':
                        newBounds = L.latLngBounds([ne.lat, newLatLng.lng], [newLatLng.lat, ne.lng])
                        break
                    case 'se':
                        newBounds = L.latLngBounds(nw, newLatLng)
                        break
                }
                
                // Validation: empêcher inversion du rectangle
                if (newBounds && this.isValidBounds(newBounds)) {
                    this.rectangle.setBounds(newBounds)
                    this.updateHandles()
                    // Ne pas régénérer pendant le drag (performance)
                }
            }
            
            isValidBounds(bounds) {
                const nw = bounds.getNorthWest()
                const se = bounds.getSouthEast()
                
                // Vérifier que le rectangle n'est pas inversé
                return (nw.lat > se.lat) && (se.lng > nw.lng)
            }
            
            onTransformEnd() {
                // IMPORTANT: Mettre à jour centre ET dimensions après resize
                const newBounds = this.rectangle.getBounds()
                this.originalCenter = newBounds.getCenter()
                this.originalBounds = newBounds
                
                // Recalculer dimensions pixel après resize
                const nwPixel = map.latLngToContainerPoint(newBounds.getNorthWest())
                const sePixel = map.latLngToContainerPoint(newBounds.getSouthEast())
                this.originalWidthPixels = Math.abs(sePixel.x - nwPixel.x)
                this.originalHeightPixels = Math.abs(sePixel.y - nwPixel.y)
                
                // Régénérer modules après resize
                this.regenerateModules()
                applyRectanglesToModules()
                console.log("✅ Transform terminé - centre + dimensions MAJ - modules régénérés")
            }
            
            onRotationStart(e) {
                this.isRotating = true
                const center = this.rectangle.getBounds().getCenter()
                const mouseLatLng = e.latlng
                
                // Calculer angle initial
                this.rotationStartAngle = this.calculateAngle(center, mouseLatLng)
                this.rotationCenter = center
                
                // CRITIQUE: Désactiver drag de la carte pendant rotation
                map.dragging.disable()
                map.doubleClickZoom.disable()
                map.scrollWheelZoom.disable()
                
                // Changer curseur
                this.handles.rotate.getElement().style.cursor = 'grabbing'
                
                // Ajouter listeners globaux pour mousemove et mouseup
                map.on('mousemove', this.onRotationMove, this)
                map.on('mouseup', this.onRotationEnd, this)
                
                // Empêcher propagation
                L.DomEvent.stopPropagation(e.originalEvent)
                L.DomEvent.preventDefault(e.originalEvent)
            }
            
            onRotationMove(e) {
                if (!this.isRotating) return
                
                const currentAngle = this.calculateAngle(this.rotationCenter, e.latlng)
                let angleDiff = currentAngle - this.rotationStartAngle
                
                // NOUVEAU: SNAP ANGLE - Rotation par paliers de 5° (sauf si Shift enfoncé)
                const snapAngle = 5  // Paliers de 5 degrés
                if (!e.originalEvent.shiftKey) {
                    angleDiff = Math.round(angleDiff / snapAngle) * snapAngle
                }
                
                // Rotation visuelle du rectangle
                this.rotateRectangle(angleDiff)
                this.updateHandles()
                
                // Afficher angle actuel en grand (aide visuelle)
                this.showRotationAngle(angleDiff)
                
                // NOUVEAU: Aperçu modules en temps réel pendant rotation
                if (liveRotationPreview) {
                    this.regenerateModules()
                }
            }
            
            onRotationEnd(e) {
                if (!this.isRotating) return
                
                this.isRotating = false
                this.handles.rotate.getElement().style.cursor = 'grab'
                
                // CRITIQUE: Réactiver drag de la carte après rotation
                map.dragging.enable()
                map.doubleClickZoom.enable()
                map.scrollWheelZoom.enable()
                
                // Retirer listeners globaux
                map.off('mousemove', this.onRotationMove, this)
                map.off('mouseup', this.onRotationEnd, this)
                
                // Masquer indicateur angle
                this.hideRotationAngle()
                
                // Régénérer modules après rotation
                this.regenerateModules()
                applyRectanglesToModules()
                console.log("✅ Rotation terminée - modules régénérés")
                
                // NOUVEAU: Sauvegarder config rectangles en localStorage
                saveRectanglesConfig()
            }
            
            calculateAngle(center, point) {
                // Calculer angle en degrés entre centre et point
                const dx = point.lng - center.lng
                const dy = point.lat - center.lat
                return Math.atan2(dy, dx) * (180 / Math.PI)
            }
            
            showRotationAngle(angleDegrees) {
                // Afficher angle actuel en grand pendant rotation
                if (!this.angleIndicator) {
                    const center = this.rectangle.getBounds().getCenter()
                    
                    // Créer marker avec angle en grand format
                    const angleIcon = L.divIcon({
                        className: 'rotation-angle-indicator',
                        html: '<div style="background:rgba(0,0,0,0.85);color:#fbbf24;padding:12px 20px;border-radius:8px;font-size:24px;font-weight:bold;border:3px solid #fbbf24;box-shadow:0 4px 12px rgba(0,0,0,0.5);white-space:nowrap;">' + 
                              '<div style="font-size:14px;color:#fff;margin-bottom:4px;">🔄 ROTATION</div>' +
                              '<div>' + Math.round(angleDegrees) + '°</div>' +
                              '<div style="font-size:11px;color:#94a3b8;margin-top:4px;">Shift = rotation libre</div>' +
                              '</div>',
                        iconSize: [150, 100],
                        iconAnchor: [75, 50]
                    })
                    
                    this.angleIndicator = L.marker(center, { 
                        icon: angleIcon,
                        interactive: false,
                        zIndexOffset: 2000
                    }).addTo(map)
                } else {
                    // Mettre à jour angle
                    const center = this.rectangle.getBounds().getCenter()
                    this.angleIndicator.setLatLng(center)
                    
                    const angleIcon = L.divIcon({
                        className: 'rotation-angle-indicator',
                        html: '<div style="background:rgba(0,0,0,0.85);color:#fbbf24;padding:12px 20px;border-radius:8px;font-size:24px;font-weight:bold;border:3px solid #fbbf24;box-shadow:0 4px 12px rgba(0,0,0,0.5);white-space:nowrap;">' + 
                              '<div style="font-size:14px;color:#fff;margin-bottom:4px;">🔄 ROTATION</div>' +
                              '<div>' + Math.round(angleDegrees) + '°</div>' +
                              '<div style="font-size:11px;color:#94a3b8;margin-top:4px;">Shift = rotation libre</div>' +
                              '</div>',
                        iconSize: [150, 100],
                        iconAnchor: [75, 50]
                    })
                    
                    this.angleIndicator.setIcon(angleIcon)
                }
            }
            
            hideRotationAngle() {
                if (this.angleIndicator) {
                    map.removeLayer(this.angleIndicator)
                    this.angleIndicator = null
                }
            }
            
            rotateRectangle(angleDegrees) {
                // ROTATION PIXEL PUR - Aucune déformation Mercator
                
                // Utiliser centre original stocké (pas bounds qui peut être déformé)
                const center = this.originalCenter
                const centerPixel = map.latLngToContainerPoint(center)
                
                // Convertir angle en radians
                const angleRad = angleDegrees * (Math.PI / 180)
                const cos = Math.cos(angleRad)
                const sin = Math.sin(angleRad)
                
                // CRITIQUE: Recalculer dimensions pixel au zoom ACTUEL (comme regenerateModules)
                const currentNWPixel = map.latLngToContainerPoint(this.originalBounds.getNorthWest())
                const currentSEPixel = map.latLngToContainerPoint(this.originalBounds.getSouthEast())
                const currentWidthPixels = Math.abs(currentSEPixel.x - currentNWPixel.x)
                const currentHeightPixels = Math.abs(currentSEPixel.y - currentNWPixel.y)
                
                // Calculer les 4 coins du rectangle NON pivoté en pixel
                const halfWidth = currentWidthPixels / 2
                const halfHeight = currentHeightPixels / 2
                
                const cornersLocal = [
                    { x: -halfWidth, y: -halfHeight },  // NW (top-left)
                    { x: +halfWidth, y: -halfHeight },  // NE (top-right)
                    { x: +halfWidth, y: +halfHeight },  // SE (bottom-right)
                    { x: -halfWidth, y: +halfHeight }   // SW (bottom-left)
                ]
                
                // Appliquer rotation 2D pure en pixel
                const cornersRotated = cornersLocal.map(corner => ({
                    x: centerPixel.x + (corner.x * cos - corner.y * sin),
                    y: centerPixel.y + (corner.x * sin + corner.y * cos)
                }))
                
                // Convertir coins pixel → GPS
                const newNW = map.containerPointToLatLng([cornersRotated[0].x, cornersRotated[0].y])
                const newNE = map.containerPointToLatLng([cornersRotated[1].x, cornersRotated[1].y])
                const newSE = map.containerPointToLatLng([cornersRotated[2].x, cornersRotated[2].y])
                const newSW = map.containerPointToLatLng([cornersRotated[3].x, cornersRotated[3].y])
                
                // IMPORTANT: Leaflet.rectangle ne supporte que rectangles alignés axes
                // Pour rotation visuelle, on doit utiliser un polygon
                // Convertir rectangle en polygon rotatif
                if (!this.rotatedPolygon) {
                    this.rotatedPolygon = L.polygon([
                        [newNW.lat, newNW.lng],
                        [newNE.lat, newNE.lng],
                        [newSE.lat, newSE.lng],
                        [newSW.lat, newSW.lng]
                    ], {
                        color: "#f59e0b",
                        weight: 3,
                        opacity: 0.8,
                        fillColor: "#f59e0b",
                        fillOpacity: 0.15,
                        interactive: true,
                        bubblingMouseEvents: false
                    })
                    
                    // Remplacer rectangle par polygon
                    drawnItems.removeLayer(this.rectangle)
                    this.rotatedPolygon.addTo(drawnItems)
                    
                    // CRITIQUE: Attacher les events de sélection au polygon rotatif
                    this.rotatedPolygon.on('click', (e) => {
                        console.log("🎯 RotatedPolygon sélectionné, ID:", this.id)
                        
                        if (e && e.originalEvent) {
                            L.DomEvent.stopPropagation(e.originalEvent)
                        }
                        
                        // Désactiver handles des autres rectangles
                        moduleRectangles.forEach(rect => {
                            if (rect.id !== this.id && rect.rectangle) {
                                rect.hideHandles()
                            }
                        })
                        
                        // Activer handles de ce rectangle
                        this.showHandles()
                    })
                    
                    // Attacher drag events au polygon (AVEC seuil 10px comme rectangle)
                    this.rotatedPolygon.on('mousedown', (e) => {
                        if (!this.isRotating && e.originalEvent.button === 0) {
                            // Préparer le drag MAIS ne pas encore activer isDragging
                            // On active seulement après déplacement de 10+ pixels (évite drag accidentel)
                            this.dragPrepared = true
                            this.dragStartPixel = map.latLngToContainerPoint(e.latlng)
                            this.dragStartBounds = this.rectangle.getBounds()
                            // CRITIQUE: Sauvegarder AUSSI les corners initiaux du polygon
                            this.dragStartPolygonCorners = this.rotatedPolygon.getLatLngs()[0].map(ll => ({lat: ll.lat, lng: ll.lng}))
                            L.DomEvent.stopPropagation(e.originalEvent)
                            L.DomEvent.preventDefault(e.originalEvent)
                            console.log("🖱️ Préparation drag rotatedPolygon ID:", this.id)
                        }
                    })
                } else {
                    // Mettre à jour coords polygon
                    this.rotatedPolygon.setLatLngs([
                        [newNW.lat, newNW.lng],
                        [newNE.lat, newNE.lng],
                        [newSE.lat, newSE.lng],
                        [newSW.lat, newSW.lng]
                    ])
                }
                
                // Stocker angle rotation pour régénération modules
                this.currentRotation = angleDegrees
            }
            
            // ================================================================
            // RÉINITIALISER ROTATION
            // ================================================================
            resetRotation() {
                console.log("🔄 Réinitialisation rotation rectangle", this.id)
                
                // Si polygon rotatif existe, le supprimer et restaurer rectangle
                if (this.rotatedPolygon) {
                    drawnItems.removeLayer(this.rotatedPolygon)
                    this.rotatedPolygon = null
                    this.rectangle.addTo(drawnItems)
                    
                    // CRITIQUE: Reconfigurer les events sur le rectangle après reset rotation
                    this.setupDragEvents()
                }
                
                // Réinitialiser angle
                this.currentRotation = 0
                
                // Cacher et recréer handles
                this.hideHandles()
                
                // Régénérer modules sans rotation
                this.regenerateModules()
                applyRectanglesToModules()
                
                // Mettre à jour style rectangle
                this.rectangle.setStyle({ weight: 4, color: '#3b82f6' })
                
                console.log("✅ Rotation réinitialisée - rectangle restauré")
                
                // NOUVEAU: Sauvegarder config rectangles
                saveRectanglesConfig()
            }
            
            // ================================================================
            // SYNCHRONISATION EL: Rafraîchir couleurs modules
            // ================================================================
            refreshModuleColors() {
                // CRITIQUE: Vérifier que rectangle existe (protection null après suppression)
                if (!this.rectangle) {
                    console.warn("⚠️ refreshModuleColors() appelé sur rectangle supprimé, ID:", this.id)
                    return
                }
                
                // Mettre à jour couleurs des modules affichés après sync EL
                console.log(" Rectangle", this.id, ":", this.modules.length, "modules - refreshing colors...")
                
                // Les modules sont affichés par renderModules() qui utilise déjà
                // module_status pour déterminer la couleur
                // Donc on appelle simplement renderModules() depuis la fonction sync
                
                // Optionnel: Mettre à jour le contour du rectangle selon le pire statut
                const hasDeadModules = this.modules.some(m => m.module_status === 'dead')
                const hasStringOpenModules = this.modules.some(m => m.module_status === 'string_open')
                const hasMicrocracksModules = this.modules.some(m => m.module_status === 'microcracks')
                
                let borderColor = "#f97316"  // Orange par défaut
                
                if (hasDeadModules) {
                    borderColor = "#ef4444"  // Rouge si modules dead
                } else if (hasStringOpenModules) {
                    borderColor = "#3b82f6"  // Bleu si string ouvert
                } else if (hasMicrocracksModules) {
                    borderColor = "#f97316"  // Orange si microfissures
                } else {
                    borderColor = "#22c55e"  // Vert si tout OK
                }
                
                this.rectangle.setStyle({ color: borderColor })
                
                console.log("✅ Rectangle", this.id, "border color updated:", borderColor)
            }
        }
        
        // ================================================================
        // GESTION STRUCTURES (Bâtiments/Ombrières/Champs) - NOUVEAU
        // ================================================================
        
        async function loadStructures() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/structures\`)
                const data = await response.json()
                
                if (data.success && data.structures) {
                    structures = data.structures
                    
                    // Afficher chaque structure sur la carte
                    structures.forEach(structure => {
                        displayStructure(structure)
                    })
                    
                    updateStructuresUI()
                    console.log("✅ Structures chargées:", structures.length)
                }
            } catch (error) {
                console.error('Erreur chargement structures:', error)
            }
        }
        
        function displayStructure(structure) {
            const geometry = typeof structure.geometry === "string" ? JSON.parse(structure.geometry) : structure.geometry
            
            // Créer polygon Leaflet
            const coords = geometry.coordinates[0].map(coord => [coord[0], coord[1]])
            
            const layer = L.polygon(coords, {
                color: structure.stroke_color || '#6b7280',
                weight: 2,
                fillColor: structure.fill_color || '#d1d5db',
                fillOpacity: structure.opacity || 0.3,
                className: "structure-layer"
            })
            
            // Tooltip avec nom structure
            layer.bindTooltip(structure.structure_name, {
                permanent: false,
                direction: "center",
                className: "structure-tooltip"
            })
            
            // Ajouter au calque structures
            layer.addTo(structuresLayer)
            
            // Stocker référence layer dans structure
            structure.layer = layer
        }
        
        function startDrawingStructure(type) {
            currentDrawingStructureType = type
            
            // Activer dessin polygon Leaflet
            if (!structureDrawControl) {
                structureDrawControl = new L.Draw.Polygon(map, {
                    shapeOptions: {
                        color: type === "building" ? '#6b7280' : type === "carport" ? '#f59e0b' : "#22c55e",
                        fillColor: type === "building" ? '#d1d5db' : type === "carport" ? '#fbbf24' : "#86efac",
                        fillOpacity: 0.3
                    }
                })
            }
            
            structureDrawControl.enable()
            
            // Écouter fin de dessin
            map.once('draw:created', handleStructureDrawn)
        }
        
        async function handleStructureDrawn(e) {
            const layer = e.layer
            const latlngs = layer.getLatLngs()[0]
            
            // Calculer surface
            const area = L.GeometryUtil.geodesicArea(latlngs)
            
            // Demander nom structure
            const typeLabels = {
                'building': "Bâtiment",
                'carport': "Ombrière",
                'ground': "Champ",
                'technical': "Zone Technique"
            }
            
            const defaultName = typeLabels[currentDrawingStructureType] + " " + (structures.length + 1)
            const name = prompt('Nom de la structure:', defaultName)
            
            if (!name) {
                console.log("❌ Création structure annulée")
                return
            }
            
            // Préparer geometry GeoJSON
            const coordinates = latlngs.map(ll => [ll.lat, ll.lng])
            coordinates.push(coordinates[0]) // Fermer polygon
            
            const geometry = {
                type: "Polygon",
                coordinates: [coordinates]
            }
            
            // Couleurs par type
            const colors = {
                'building': { fill: "#d1d5db", stroke: "#6b7280" },
                'carport': { fill: "#fbbf24", stroke: "#f59e0b" },
                'ground': { fill: "#86efac", stroke: "#22c55e" },
                'technical': { fill: "#60a5fa", stroke: "#3b82f6" }
            }
            
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/structures\`, {
                    method: "POST",
                    headers: { 'Content-Type': "application/json" },
                    body: JSON.stringify({
                        structure_type: currentDrawingStructureType,
                        structure_name: name,
                        geometry: geometry,
                        area_sqm: area,
                        fill_color: colors[currentDrawingStructureType].fill,
                        stroke_color: colors[currentDrawingStructureType].stroke,
                        opacity: 0.3
                    })
                })
                
                const data = await response.json()
                
                if (data.success) {
                    // Recharger structures
                    await loadStructures()
                    alert("✅ Structure créée: " + name + " (" + Math.round(area) + " m²)")
                }
            } catch (error) {
                console.error('Erreur création structure:', error)
                alert("❌ Erreur création structure")
            }
            
            currentDrawingStructureType = null
        }
        
        async function deleteStructure(structureId) {
            if (!confirm('Supprimer cette structure ?')) return
            
            try {
                await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/structures/\${structureId}\`, {
                    method: "DELETE"
                })
                
                // Retirer de la carte
                const structure = structures.find(s => s.id === structureId)
                if (structure && structure.layer) {
                    structuresLayer.removeLayer(structure.layer)
                }
                
                // Retirer de l'array
                structures = structures.filter(s => s.id !== structureId)
                
                updateStructuresUI()
                alert("✅ Structure supprimée")
            } catch (error) {
                console.error('Erreur suppression structure:', error)
                alert("❌ Erreur suppression")
            }
        }
        
        function updateStructuresUI() {
            const container = document.getElementById('structuresContainer')
            const list = document.getElementById('structuresList')
            
            if (structures.length === 0) {
                list.classList.add('hidden')
                return
            }
            
            list.classList.remove('hidden')
            
            // Icônes par type
            const icons = {
                'building': "Batiment",
                'carport': "️",
                'ground': "Sol",
                'technical': "Tech"
            }
            
            container.innerHTML = structures.map(s => \`
                <div class="bg-black rounded p-2 text-xs flex justify-between items-center">
                    <div>
                        <div class="font-bold text-white">\${icons[s.structure_type]} \${s.structure_name}</div>
                        <div class="text-gray-400">\${Math.round(s.area_sqm)} m²</div>
                    </div>
                    <button onclick="deleteStructure(\${s.id})" class="text-red-400 hover:text-red-300 px-2">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            \`).join('')
            
            // Mettre à jour surface totale
            const totalArea = structures.reduce((sum, s) => sum + s.area_sqm, 0)
            document.getElementById('totalStructuresArea').textContent = Math.round(totalArea) + " m²"
        }
        
        // ================================================================
        // INIT
        // ================================================================
        async function init() {
            console.log(" INIT STARTED")
            try {
                await loadPlantData()
                console.log("✅ Plant data loaded")
                await loadZoneData()
                console.log("✅ Zone data loaded")
                initMap()
                console.log("✅ Map initialized")
                await loadStructures() // NOUVEAU: Charger structures
                console.log("✅ Structures loaded")
                await loadModules()
                console.log("✅ Modules loaded")
                await loadInverters()
                console.log("✅ Inverters loaded")
                setupEventListeners()
                console.log("✅ Event listeners setup")
                updateStats()
                console.log("✅ Stats updated")
                updateStringsProgress()  // Initialiser progression
                
                // AUTO-LOAD JALIBAT: Si Plant 6 et zone 14-23, charger automatiquement les 10 strings
                if (plantId === 6 && zoneId >= 14 && zoneId <= 23) {
                    console.log(" JALIBAT Plant détecté - Auto-chargement des 10 strings...")
                    // Sync EL initial
                    await syncModulesFromEL()
                    // Charger rectangles si toiture existe (TOUJOURS, ignorer moduleRectangles.length)
                    if (roofPolygon) {
                        console.log(" Toiture existante - Import automatique dans 2s...")
                        console.log("ATTENTION Les rectangles existants seront remplacés")
                        setTimeout(() => {
                            console.log(" Déclenchement auto-import JALIBAT...")
                            // Nettoyer rectangles existants
                            moduleRectangles.forEach(rect => {
                                if (rect.rectangle) map.removeLayer(rect.rectangle)
                                if (rect.gridGroup) map.removeLayer(rect.gridGroup)
                                if (rect.labelGroup) map.removeLayer(rect.labelGroup)
                                if (rect.infoMarker) map.removeLayer(rect.infoMarker)
                            })
                            moduleRectangles = []
                            // Lancer import
                            importExistingModules()
                        }, 2000)
                    } else {
                        console.log("⏳ Aucune toiture - En attente du dessin pour auto-import...")
                    }
                }
                
                console.log("✅ INIT COMPLETED")
                
                // CRITIQUE: Forcer réparation des rectangles après init
                // Les rectangles restaurés depuis localStorage ne sont pas toujours correctement ajoutés à la carte
                setTimeout(() => {
                    fixRectanglesOnMap()
                }, 500)
            } catch (error) {
                console.error("❌ INIT FAILED:", error)
            }
        }
        
        // ================================================================
        // FIX: FORCER AJOUT DES RECTANGLES À LA CARTE
        // ================================================================
        function fixRectanglesOnMap() {
            console.log("🔧 Vérification rectangles sur carte...")
            
            moduleRectangles.forEach((rect, index) => {
                // CRITIQUE: Ignorer rectangles supprimés (rectangle = null)
                if (!rect.rectangle) {
                    console.warn("⚠️ fixRectanglesOnMap() skip rectangle supprimé, ID:", rect.id)
                    return
                }
                
                // Vérifier si le rectangle est bien sur la carte
                if (!map.hasLayer(rect.rectangle)) {
                    console.log("⚠️ Rectangle " + rect.id + " pas sur carte - correction...")
                    
                    // Supprimer de partout d'abord
                    if (drawnItems.hasLayer(rect.rectangle)) {
                        drawnItems.removeLayer(rect.rectangle)
                    }
                    
                    // Re-créer le rectangle proprement
                    const bounds = rect.rectangle.getBounds()
                    rect.rectangle = L.rectangle(bounds, {
                        color: "#f59e0b",
                        weight: 3,
                        fillColor: "#f59e0b",
                        fillOpacity: 0.15,
                        interactive: true,
                        bubblingMouseEvents: false
                    })
                    
                    // Ajouter à la carte
                    map.addLayer(rect.rectangle)
                    drawnItems.addLayer(rect.rectangle)
                    rect.rectangle.bringToFront()
                    
                    // Reconfigurer les events
                    rect.setupDragEvents()
                    rect.setupMapDragEvents()
                    
                    // Event de sélection
                    rect.rectangle.on('click', (e) => {
                        console.log('🎯 Rectangle sélectionné:', rect.id)
                        L.DomEvent.stopPropagation(e.originalEvent)
                        
                        // Désélectionner les autres
                        moduleRectangles.forEach(r => {
                            if (r.id !== rect.id && r.rectangle) r.hideHandles()
                        })
                        
                        // Sélectionner celui-ci
                        rect.showHandles()
                    })
                    
                    console.log("✅ Rectangle " + rect.id + " corrigé")
                } else {
                    console.log("✅ Rectangle " + rect.id + " déjà sur carte")
                }
            })
            
            console.log("✅ Tous les rectangles vérifiés")
        }
        
        // ================================================================
        // CONFIGURATION ÉLECTRIQUE - Onduleurs & Strings
        // ================================================================
        
        async function loadInverters() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/inverters\`)
                const data = await response.json()
                
                if (data.success) {
                    inverters = data.inverters || []
                    renderInvertersList()
                }
            } catch (error) {
                console.error('Erreur chargement onduleurs:', error)
            }
        }
        
        function renderInvertersList() {
            const container = document.getElementById('invertersList')
            
            if (!container) return
            
            if (inverters.length === 0) {
                container.innerHTML = '<p class="text-xs text-gray-500 text-center py-2">Aucun onduleur configuré</p>'
                return
            }
            
            container.innerHTML = inverters.map(inv => 
                '<div class="bg-black rounded p-2 text-xs border border-yellow-600">' +
                    '<div class="flex justify-between items-center mb-1">' +
                        '<span class="font-bold text-yellow-400">' + inv.inverter_name + '</span>' +
                        '<div class="flex gap-1">' +
                            '<button onclick="editInverter(' + inv.id + ')" class="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs">' +
                                '<i class="fas fa-edit"></i>' +
                            '</button>' +
                            '<button onclick="deleteInverter(' + inv.id + ')" class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">' +
                                '<i class="fas fa-trash"></i>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="text-gray-400 space-y-1">' +
                        '<div>⚡ ' + inv.rated_power_kw + ' kW</div>' +
                        '<div>📊 ' + (inv.assigned_strings || 0) + ' strings / ' + (inv.module_count || 0) + ' modules</div>' +
                        '<div class="flex items-center gap-2">' +
                            '<span>Charge:</span>' +
                            '<div class="flex-1 bg-gray-700 rounded-full h-2">' +
                                '<div class="bg-yellow-400 h-2 rounded-full" style="width: ' + (inv.load_percent || 0) + '%"></div>' +
                            '</div>' +
                            '<span class="font-bold">' + (inv.load_percent || 0) + '%</span>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            ).join('')
        }
        
        function showInverterModal(inverterId = null) {
            const modal = document.getElementById('inverterModal')
            const form = document.getElementById('inverterForm')
            const title = document.getElementById('inverterModalTitle')
            
            if (!modal || !form || !title) return
            
            // Mode création vs édition
            if (inverterId) {
                const inverter = inverters.find(i => i.id === inverterId)
                if (!inverter) return
                
                currentEditingInverter = inverter
                title.textContent = 'MODIFIER ONDULEUR'
                
                // Remplir formulaire
                document.getElementById('inverterId').value = inverter.id
                document.getElementById('inverterName').value = inverter.inverter_name
                document.getElementById('inverterPower').value = inverter.rated_power_kw
                document.getElementById('inverterBrand').value = inverter.inverter_brand || ''
                document.getElementById('inverterModel').value = inverter.inverter_model || ''
                document.getElementById('inverterMppt').value = inverter.mppt_count || 4
                document.getElementById('inverterEfficiency').value = inverter.efficiency_percent || 98
                document.getElementById('inverterNotes').value = inverter.notes || ''
            } else {
                currentEditingInverter = null
                title.textContent = 'NOUVEL ONDULEUR'
                form.reset()
                document.getElementById('inverterId').value = ''
            }
            
            // Générer checkboxes strings disponibles
            populateStringCheckboxes(inverterId)
            
            modal.classList.remove('hidden')
        }
        
        function hideInverterModal() {
            const modal = document.getElementById('inverterModal')
            if (modal) {
                modal.classList.add('hidden')
            }
            currentEditingInverter = null
        }
        
        function populateStringCheckboxes(inverterId) {
            const container = document.getElementById('stringCheckboxes')
            
            if (!container) return
            
            // Récupérer strings uniques des modules
            const uniqueStrings = [...new Set(modules.map(m => m.string_number))]
                .filter(s => s != null)
                .sort((a, b) => a - b)
            
            if (uniqueStrings.length === 0) {
                container.innerHTML = '<p class="col-span-4 text-xs text-gray-500 text-center">Aucun string détecté</p>'
                return
            }
            
            // Si édition, récupérer strings déjà attribués
            let assignedStrings = []
            if (inverterId) {
                const inv = inverters.find(i => i.id === inverterId)
                // Les strings attribués sont dans les résultats de l'API
                assignedStrings = inv?.strings?.map(s => s.string_number) || []
            }
            
            container.innerHTML = uniqueStrings.map(strNum => {
                const checked = assignedStrings.includes(strNum) ? 'checked' : ''
                return '<label class="flex items-center gap-1 text-xs bg-gray-700 p-2 rounded cursor-pointer hover:bg-gray-600">' +
                    '<input type="checkbox" name="strings" value="' + strNum + '" ' + checked + ' class="form-checkbox text-yellow-400">' +
                    '<span>S' + strNum + '</span>' +
                    '</label>'
            }).join('')
        }
        
        async function saveInverter(event) {
            event.preventDefault()
            
            const inverterId = document.getElementById('inverterId').value
            const formData = {
                inverter_name: document.getElementById('inverterName').value,
                rated_power_kw: parseFloat(document.getElementById('inverterPower').value),
                inverter_brand: document.getElementById('inverterBrand').value || null,
                inverter_model: document.getElementById('inverterModel').value || null,
                mppt_count: parseInt(document.getElementById('inverterMppt').value) || 4,
                efficiency_percent: parseFloat(document.getElementById('inverterEfficiency').value) || 98,
                notes: document.getElementById('inverterNotes').value || null
            }
            
            try {
                let response
                if (inverterId) {
                    // Mise à jour
                    response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/inverters/\${inverterId}\`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    })
                } else {
                    // Création
                    response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/inverters\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    })
                }
                
                const data = await response.json()
                
                if (data.success) {
                    // Gérer attributions strings
                    const newInverterId = inverterId || data.inverter.id
                    await updateStringAssignments(newInverterId)
                    
                    // Recharger liste
                    await loadInverters()
                    hideInverterModal()
                    alert('Onduleur enregistré avec succès!')
                } else {
                    alert('Erreur: ' + data.error)
                }
            } catch (error) {
                console.error('Erreur sauvegarde onduleur:', error)
                alert('Erreur sauvegarde onduleur')
            }
        }
        
        async function updateStringAssignments(inverterId) {
            const selectedStrings = Array.from(document.querySelectorAll('input[name="strings"]:checked'))
                .map(cb => parseInt(cb.value))
            
            // Récupérer strings actuellement attribués
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/inverters/\${inverterId}\`)
                const data = await response.json()
                
                if (!data.success) return
                
                const currentStrings = data.strings?.map(s => s.string_number) || []
                
                // Retirer strings décochés
                for (const strNum of currentStrings) {
                    if (!selectedStrings.includes(strNum)) {
                        await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/inverters/\${inverterId}/assign-string/\${strNum}\`, {
                            method: 'DELETE'
                        })
                    }
                }
                
                // Ajouter nouveaux strings
                for (const strNum of selectedStrings) {
                    if (!currentStrings.includes(strNum)) {
                        await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/inverters/\${inverterId}/assign-string\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ string_number: strNum })
                        })
                    }
                }
            } catch (error) {
                console.error('Erreur sync strings:', error)
            }
        }
        
        async function deleteInverter(id) {
            const inverter = inverters.find(i => i.id === id)
            if (!inverter) return
            
            if (!confirm(\`Supprimer l'onduleur "\${inverter.inverter_name}" ?\`)) {
                return
            }
            
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/inverters/\${id}\`, {
                    method: 'DELETE'
                })
                
                const data = await response.json()
                
                if (data.success) {
                    await loadInverters()
                    alert('Onduleur supprimé')
                } else {
                    alert('Erreur: ' + data.error)
                }
            } catch (error) {
                console.error('Erreur suppression onduleur:', error)
                alert('Erreur suppression onduleur')
            }
        }
        
        async function validateElectricalConfig() {
            const validationDiv = document.getElementById('electricalValidation')
            const warningsDiv = document.getElementById('validationWarnings')
            const errorsDiv = document.getElementById('validationErrors')
            
            if (!validationDiv || !warningsDiv || !errorsDiv) return
            
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/electrical-validation\`)
                const data = await response.json()
                
                if (data.success) {
                    const val = data.validation
                    
                    let warningsHtml = ''
                    if (val.warnings && val.warnings.length > 0) {
                        warningsHtml = val.warnings.map(w => '<div>⚠️ ' + w + '</div>').join('')
                    }
                    
                    let errorsHtml = ''
                    if (val.errors && val.errors.length > 0) {
                        errorsHtml = val.errors.map(e => '<div>❌ ' + e + '</div>').join('')
                    }
                    
                    if (warningsHtml || errorsHtml) {
                        validationDiv.classList.remove('hidden')
                        warningsDiv.innerHTML = warningsHtml
                        errorsDiv.innerHTML = errorsHtml
                    } else {
                        validationDiv.classList.remove('hidden')
                        warningsDiv.innerHTML = '<div class="text-green-400">✅ Configuration valide</div>'
                        errorsDiv.innerHTML = ''
                    }
                    
                    console.log('📊 Validation Électrique:', val)
                }
            } catch (error) {
                console.error('Erreur validation:', error)
                alert('Erreur validation configuration')
            }
        }
        
        // Fonctions globales pour onclick
        window.editInverter = (id) => showInverterModal(id)
        window.deleteInverter = deleteInverter
        
        // ================================================================
        // FONCTIONS EXPORT (GeoJSON, KML, CSV)
        // ================================================================
        
        async function exportGeoJSON() {
            try {
                console.log('📥 Export GeoJSON démarré...')
                const url = '/api/pv/plants/' + plantId + '/zones/' + zoneId + '/export/geojson'
                const response = await fetch(url)
                
                if (!response.ok) {
                    throw new Error('Erreur export GeoJSON: ' + response.statusText)
                }
                
                const blob = await response.blob()
                const downloadUrl = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = downloadUrl
                a.download = plantData.plant_name + '_' + zoneData.zone_name + '_modules.geojson'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(downloadUrl)
                
                console.log('✅ Export GeoJSON réussi')
                alert('✅ Export GeoJSON téléchargé avec succès')
            } catch (error) {
                console.error('❌ Erreur export GeoJSON:', error)
                alert('❌ Erreur export GeoJSON: ' + error.message)
            }
        }
        
        async function exportKML() {
            try {
                console.log('📥 Export KML démarré...')
                const url = '/api/pv/plants/' + plantId + '/zones/' + zoneId + '/export/kml'
                const response = await fetch(url)
                
                if (!response.ok) {
                    throw new Error('Erreur export KML: ' + response.statusText)
                }
                
                const blob = await response.blob()
                const downloadUrl = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = downloadUrl
                a.download = plantData.plant_name + '_' + zoneData.zone_name + '_modules.kml'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(downloadUrl)
                
                console.log('✅ Export KML réussi')
                alert('✅ Export KML téléchargé avec succès')
            } catch (error) {
                console.error('❌ Erreur export KML:', error)
                alert('❌ Erreur export KML: ' + error.message)
            }
        }
        
        async function exportCSV() {
            try {
                console.log('📥 Export CSV démarré...')
                const url = '/api/pv/plants/' + plantId + '/zones/' + zoneId + '/export/csv'
                const response = await fetch(url)
                
                if (!response.ok) {
                    throw new Error('Erreur export CSV: ' + response.statusText)
                }
                
                const blob = await response.blob()
                const downloadUrl = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = downloadUrl
                a.download = plantData.plant_name + '_' + zoneData.zone_name + '_modules.csv'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(downloadUrl)
                
                console.log('✅ Export CSV réussi')
                alert('✅ Export CSV téléchargé avec succès')
            } catch (error) {
                console.error('❌ Erreur export CSV:', error)
                alert('❌ Erreur export CSV: ' + error.message)
            }
        }
        
        async function loadPlantData() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}\`)
                const data = await response.json()
                plantData = data.plant
            } catch (error) {
                console.error('Erreur chargement centrale:', error)
                plantData = { latitude: 48.8566, longitude: 2.3522, plant_name: "Centrale" }
            }
        }
        
        async function loadZoneData() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}\`)
                const data = await response.json()
                zoneData = data.zone
                document.getElementById('zoneTitle').textContent = zoneData.zone_name
                
                // Charger config électrique (avec vérification DOM)
                const inverterCountEl = document.getElementById('inverterCount')
                const junctionBoxCountEl = document.getElementById('junctionBoxCount')
                const stringCountEl = document.getElementById('stringCount')
                const modulesPerStringEl = document.getElementById('modulesPerString')
                
                if (zoneData.inverter_count && inverterCountEl) inverterCountEl.value = zoneData.inverter_count
                if (zoneData.junction_box_count && junctionBoxCountEl) junctionBoxCountEl.value = zoneData.junction_box_count
                if (zoneData.string_count && stringCountEl) stringCountEl.value = zoneData.string_count
                if (zoneData.modules_per_string && modulesPerStringEl) modulesPerStringEl.value = zoneData.modules_per_string
                
                // Charger config strings non réguliers
                if (zoneData.strings_config && zoneData.strings_config !== "null") {
                    try {
                        const parsed = JSON.parse(zoneData.strings_config)
                        // Vérifier que c'est bien un array valide
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            stringsConfig = parsed
                            console.log("✅ Configuration strings chargée:", stringsConfig)
                        } else {
                            stringsConfig = []
                            console.log("ATTENTION Configuration strings vide ou invalide")
                        }
                    } catch (e) {
                        console.error('❌ Erreur parsing strings_config:', e)
                        stringsConfig = []
                    }
                } else {
                    stringsConfig = []
                    console.log("ℹ️ Aucune configuration strings sauvegardée")
                }
            } catch (error) {
                console.error('Erreur chargement zone:', error)
                zoneData = { zone_name: "Zone", azimuth: 180, tilt: 30 }
            }
        }
        
        function initMap() {
            const lat = plantData.latitude || 48.8566
            const lng = plantData.longitude || 2.3522
            
            map = L.map('map', {
                center: [lat, lng],
                zoom: 20,
                maxZoom: 22
            })
            
            // NOUVEAU: Deux calques de fond avec contrôle de bascule
            // Google Satellite - Meilleur zoom et disponibilité
            const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                maxZoom: 22,           // Zoom maximum de la carte
                maxNativeZoom: 21,     // Zoom maximum des tuiles natives
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: 'Map data © Google'
            })
            
            // Esri Satellite - Alternative (zoom moins élevé)
            const esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 22,
                maxNativeZoom: 19,     // Esri s'arrête à zoom 19
                attribution: '© Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN'
            })
            
            const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            })
            
            // NOUVEAU: Overlay labels (noms de rues) transparent - fonctionne sur satellite
            const labelsLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png', {
                maxZoom: 20,
                attribution: 'Map labels by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
                opacity: 0.8
            })
            
            // Ajouter vue satellite par défaut + labels
            satelliteLayer.addTo(map)
            labelsLayer.addTo(map)  // ✅ Labels activés par défaut
            
            // Contrôle de basculement entre vues
            const baseLayers = {
                '🛰️ Satellite (Google)': satelliteLayer,
                '🛰️ Satellite (Esri)': esriLayer,
                '🗺️ Carte avec rues': streetLayer
            }
            
            // Contrôle overlays (labels activables/désactivables)
            const overlayLayers = {
                '🏷️ Noms de rues': labelsLayer
            }
            
            L.control.layers(baseLayers, overlayLayers, { position: 'topright' }).addTo(map)
            
            // NOUVEAU: Ajouter calques hiérarchiques (structures sous modules)
            map.addLayer(structuresLayer)  // Calque 1: Structures (fond)
            map.addLayer(drawnItems)        // Calque 2: Modules + annotations
            L.control.scale({ metric: true, imperial: false }).addTo(map)
            
            // NOUVEAU: Contrôle de recherche GPS/Adresse
            L.Control.geocoder({
                defaultMarkGeocode: false,
                placeholder: 'Rechercher adresse ou coordonnées GPS...',
                errorMessage: 'Aucun résultat trouvé',
                position: 'topleft',
                collapsed: false
            })
            .on('markgeocode', function(e) {
                const latlng = e.geocode.center
                map.setView(latlng, 20)
                L.marker(latlng, {
                    icon: L.divIcon({
                        className: 'search-marker',
                        html: '<div style="background: #ef4444; color: white; padding: 8px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><i class="fas fa-map-marker-alt"></i></div>',
                        iconSize: [40, 40]
                    })
                }).addTo(map)
                    .bindPopup('<strong>' + e.geocode.name + '</strong><br><small>Lat: ' + latlng.lat.toFixed(6) + '<br>Lng: ' + latlng.lng.toFixed(6) + '</small>')
                    .openPopup()
            })
            .addTo(map)
            console.log(' Contrôle de recherche GPS/Adresse ajouté')
            
            // Event listener global: désactiver handles si clic hors rectangle
            map.on('click', (e) => {
                // Vérifier si clic sur un rectangle (géré par rectangle.on('click'))
                // Si pas de propagation stoppée, désactiver tous les handles
                setTimeout(() => {
                    let clickedOnRectangle = false
                    moduleRectangles.forEach(rect => {
                        if (rect.rectangle.getBounds().contains(e.latlng)) {
                            clickedOnRectangle = true
                        }
                    })
                    
                    // NOUVEAU: Respecter mode édition persistante
                    if (!clickedOnRectangle && !persistentEditMode) {
                        // CRITIQUE: Vérifier que rectangle existe avant appel hideHandles()
                        moduleRectangles.forEach(rect => {
                            if (rect.rectangle) {
                                rect.hideHandles()
                            }
                        })
                    }
                }, 10)
            })
            
            // Charger contour toiture existant
            if (zoneData.roof_polygon) {
                try {
                    const savedCoords = JSON.parse(zoneData.roof_polygon)
                    roofPolygon = L.polygon(savedCoords, {
                        color: "#fbbf24",
                        weight: 3,
                        fillOpacity: 0.1,
                        className: "roof-polygon"
                    }).addTo(drawnItems)
                    
                    // Calculer surface avec polygone fermé
                    const coords = roofPolygon.getLatLngs()[0].map(ll => [ll.lng, ll.lat])
                    if (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1]) {
                        coords.push([...coords[0]])
                    }
                    const validGeoJSON = turf.polygon([coords])
                    roofArea = turf.area(validGeoJSON)
                    document.getElementById('roofArea').textContent = roofArea.toFixed(2) + " m²"
                    document.getElementById('roofInfo').classList.remove('hidden')
                } catch (e) {
                    console.error('Erreur chargement polygone:', e)
                }
            }
        }
        
        async function loadModules() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`)
                const data = await response.json()
                modules = data.modules || []
                
                if (modules.length > 0) {
                    nextModuleNum = Math.max(...modules.map(m => {
                        const match = m.module_identifier.match(/\\d+/)
                        return match ? parseInt(match[0]) : 0
                    })) + 1
                }
                
                renderModules()
                updateStats()
                updateStringsProgress()  // Mettre à jour progression après chargement
            } catch (error) {
                console.error('Erreur chargement modules:', error)
            }
        }
        
        // ================================================================
        // DESSIN TOITURE
        // ================================================================
        function enableRoofDrawing() {
            console.log("️ enableRoofDrawing() appelé")
            console.log("CARTE map:", map)
            console.log(" map._container:", map ? map._container : 'undefined')
            console.log("✏️ drawControl existant:", drawControl)
            console.log(" drawnItems:", drawnItems)
            console.log(" L.Control.Draw disponible:", typeof L.Control.Draw)
            
            if (!map) {
                console.error("❌ ERREUR: La carte n'est pas initialisée!")
                alert("Erreur: La carte n'est pas initialisée. Rechargez la page.")
                return
            }
            
            if (typeof L.Control.Draw === 'undefined') {
                console.error("❌ ERREUR: Leaflet.draw n'est pas chargé!")
                alert("Erreur: Bibliothèque Leaflet.draw non disponible. Rechargez la page.")
                return
            }
            
            if (drawControl) {
                console.log("️ Suppression ancien drawControl")
                map.removeControl(drawControl)
            }
            
            console.log(" Création nouveau L.Control.Draw")
            drawControl = new L.Control.Draw({
                draw: {
                    polygon: {
                        showArea: true,
                        metric: true,
                        shapeOptions: { color: "#fbbf24", weight: 3 }
                    },
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    marker: false,
                    circlemarker: false
                },
                edit: { featureGroup: drawnItems, remove: true }
            })
            
            console.log("➕ Ajout drawControl à la carte")
            map.addControl(drawControl)
            console.log("✅ enableRoofDrawing() terminé - Contrôle ajouté")
            
            map.on(L.Draw.Event.CREATED, async (e) => {
                if (roofPolygon) drawnItems.removeLayer(roofPolygon)
                
                roofPolygon = e.layer
                drawnItems.addLayer(roofPolygon)
                
                // S'assurer que le polygone est fermé pour Turf.js
                const latLngs = roofPolygon.getLatLngs()[0]
                const coords = latLngs.map(ll => [ll.lng, ll.lat]) // GeoJSON format: [lng, lat]
                
                // Fermer le polygone si nécessaire (premier === dernier point)
                const firstPoint = coords[0]
                const lastPoint = coords[coords.length - 1]
                if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                    coords.push([...firstPoint])
                }
                
                // Créer un GeoJSON valide manuellement
                const validGeoJSON = {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "Polygon",
                        coordinates: [coords]
                    }
                }
                
                try {
                    roofArea = turf.area(validGeoJSON)
                } catch (error) {
                    console.warn('Erreur calcul surface Turf.js:', error)
                    roofArea = 0
                }
                
                document.getElementById('roofArea').textContent = roofArea.toFixed(2) + " m²"
                document.getElementById('roofInfo').classList.remove('hidden')
                
                await saveRoofPolygon()
                
                // AUTO-IMPORT JALIBAT: Si Plant 6 après dessin toiture
                if (plantId === 6 && zoneId >= 14 && zoneId <= 23) {
                    console.log(" Toiture JALIBAT dessinée - Auto-import des 10 strings...")
                    setTimeout(() => {
                        importExistingModules()
                    }, 500)
                }
            })
        }
        
        async function saveRoofPolygon() {
            if (!roofPolygon) return
            
            const coords = roofPolygon.getLatLngs()[0].map(ll => [ll.lat, ll.lng])
            
            try {
                const apiUrl = "/api/pv/plants/" + plantId + "/zones/" + zoneId + "/roof"
                await fetch(apiUrl, {
                    method: "PUT",
                    headers: { 'Content-Type': "application/json" },
                    body: JSON.stringify({
                        roof_polygon: JSON.stringify(coords),
                        roof_area_sqm: roofArea
                    })
                })
                alert("OK: Contour toiture sauvegarde!")
            } catch (error) {
                alert("ERREUR: Sauvegarde - " + error.message)
            }
        }
        
        function clearRoof() {
            const hasRectangles = moduleRectangles.length > 0
            const confirmMsg = hasRectangles 
                ? 'Effacer le contour de toiture ET tous les rectangles de modules ?' 
                : 'Effacer le contour de toiture ?'
            
            if (confirm(confirmMsg)) {
                if (roofPolygon) drawnItems.removeLayer(roofPolygon)
                roofPolygon = null
                roofArea = 0
                document.getElementById('roofInfo').classList.add('hidden')
                
                // Supprimer aussi tous les rectangles
                if (hasRectangles) {
                    moduleRectangles.forEach(rect => {
                        rect.removeFromMap()
                    })
                    moduleRectangles = []
                    modules = []
                    renderModules()
                    updateStats()
                    updateStringsProgress()
                    console.log("️ Toiture et rectangles supprimés")
                }
            }
        }
        
        // ================================================================
        // CONFIG ÉLECTRIQUE
        // ================================================================
        function openStringsConfigModal() {
            const stringCount = parseInt(document.getElementById('stringCount').value)
            
            // Initialiser config si vide ou si nombre strings changé
            if (stringsConfig.length !== stringCount) {
                stringsConfig = []
                for (let i = 0; i < stringCount; i++) {
                    stringsConfig.push({
                        stringNum: i + 1,
                        modulesCount: 10 // Valeur par défaut
                    })
                }
            }
            
            // Générer inputs
            const container = document.getElementById('stringsConfigContainer')
            container.innerHTML = ''
            
            stringsConfig.forEach((config, index) => {
                const div = document.createElement('div')
                div.className = 'flex items-center gap-3 p-3 bg-gray-800 rounded border border-gray-600'
                div.innerHTML = 
                    '<div class="flex-1">' +
                        '<label class="block text-sm font-bold text-yellow-400 mb-1">String ' + config.stringNum + '</label>' +
                        '<input type="number" ' + 
                               'class="string-modules-input w-full bg-gray-700 border border-gray-500 rounded px-3 py-2 text-center font-bold text-white" ' + 
                               'data-index="' + index + '" ' +
                               'min="1" ' +
                               'max="50" ' +
                               'value="' + config.modulesCount + '">' +
                    '</div>' +
                    '<div class="text-2xl font-black text-gray-400">' + config.modulesCount + "</div>"
                container.appendChild(div)
            })
            
            // Event listeners pour update en temps réel
            document.querySelectorAll('.string-modules-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const index = parseInt(e.target.dataset.index)
                    const value = parseInt(e.target.value) || 0
                    stringsConfig[index].modulesCount = value
                    
                    // Update display à côté
                    e.target.parentElement.nextElementSibling.textContent = value
                    
                    // Update total
                    updateTotalModulesDisplay()
                })
            })
            
            updateTotalModulesDisplay()
            document.getElementById('stringsModal').classList.remove('hidden')
        }
        
        function updateTotalModulesDisplay() {
            const total = stringsConfig.reduce((sum, config) => sum + config.modulesCount, 0)
            document.getElementById('totalModulesDisplay').textContent = total
        }
        
        function applyStringsConfig() {
            // Update summary display
            const total = stringsConfig.reduce((sum, config) => sum + config.modulesCount, 0)
            const summaryText = stringsConfig.map(c => "S" + c.stringNum + "=" + c.modulesCount).join(", ") + " (Total: " + total + ")"
            document.getElementById('stringsSummaryText').textContent = summaryText
            document.getElementById('stringsSummary').classList.remove('hidden')
            
            // NOUVEAU: Sauvegarder config strings en localStorage
            saveStringsConfigToLocalStorage()
            
            closeStringsModal()
            alert("OK: Configuration appliquee - " + total + " modules repartis sur " + stringsConfig.length + " strings")
        }
        
        function closeStringsModal() {
            document.getElementById('stringsModal').classList.add('hidden')
        }
        
        function editStringsConfig() {
            // Vérifier qu'une config existe
            if (stringsConfig.length === 0) {
                alert("ATTENTION: Aucune configuration à modifier. Créez d" + String.fromCharCode(39) + "abord une config avec 'Configurer Strings'")
                return
            }
            
            // Réouvrir modal avec config existante (pre-remplie automatiquement)
            openStringsConfigModal()
            
            console.log("✏️ Modification config strings:", stringsConfig.length, "strings")
        }
        
        async function saveElectricalConfig() {
            // Validation des champs
            const inverterEl = document.getElementById('inverterCount')
            const junctionBoxEl = document.getElementById('junctionBoxCount')
            const stringEl = document.getElementById('stringCount')
            const modulesPerStringEl = document.getElementById('modulesPerString')
            
            if (!inverterEl || !junctionBoxEl || !stringEl || !modulesPerStringEl) {
                alert("ERREUR: Champs de configuration manquants")
                return
            }
            
            const stringCount = parseInt(stringEl.value) || 0
            const modulesPerString = parseInt(modulesPerStringEl.value) || 0
            
            // Validation: Si strings configurés, vérifier cohérence
            if (stringCount > 0 && stringsConfig.length === 0) {
                alert("ATTENTION: Configurez d" + String.fromCharCode(39) + "abord les strings avec le bouton Configurer Strings!")
                return
            }
            
            if (stringsConfig.length > 0 && stringsConfig.length !== stringCount) {
                alert("ATTENTION: Nombre de strings configure (" + stringsConfig.length + ") different du nombre saisi (" + stringCount + ")!")
                return
            }
            
            const config = {
                inverter_count: parseInt(inverterEl.value) || 0,
                junction_box_count: parseInt(junctionBoxEl.value) || 0,
                string_count: stringCount,
                modules_per_string: modulesPerString,
                strings_config: stringsConfig.length > 0 ? stringsConfig : null
            }
            
            try {
                const apiUrl = "/api/pv/plants/" + plantId + "/zones/" + zoneId + "/config"
                await fetch(apiUrl, {
                    method: "PUT",
                    headers: { 'Content-Type': "application/json" },
                    body: JSON.stringify(config)
                })
                
                const summary = stringsConfig.length > 0 ? stringsConfig.map(c => "S" + c.stringNum + "=" + c.modulesCount).join(", ") : "Config uniforme"
                alert("✅ Configuration sauvegardée: " + summary)
            } catch (error) {
                alert("❌ Erreur sauvegarde config: " + error.message)
            }
        }
        
        // ==== BOUTON AUTO-FILL MODULES ==== (DISABLED - Button not in HTML)
        /*
        document.getElementById('autoFillBtn').addEventListener('click', async () => {
            if (!roofPolygon) {
                alert("ATTENTION: Dessinez d" + String.fromCharCode(39) + "abord le contour de toiture!")
                return
            }
            
            // Utiliser config strings si définie, sinon config uniforme
            const stringCount = parseInt(document.getElementById('stringCount').value)
            let totalModules = 0
            let useCustomConfig = stringsConfig.length === stringCount && stringsConfig.length > 0
            
            // MODE INTELLIGENT : Si pas de config, créer distribution uniforme
            if (!useCustomConfig) {
                console.log("ATTENTION Aucune config custom - création distribution uniforme")
                
                // Calculer nombre optimal de modules par string (20-30 modules recommandés)
                const targetModulesPerString = 25
                const calculatedStrings = Math.ceil(totalModules / targetModulesPerString)
                
                // Créer distribution uniforme
                const baseModulesPerString = Math.floor(totalModules / calculatedStrings)
                const remainder = totalModules % calculatedStrings
                
                stringsConfig = []
                for (let i = 1; i <= calculatedStrings; i++) {
                    // Les premiers strings prennent 1 module de plus si reste
                    const modulesForThisString = baseModulesPerString + (i <= remainder ? 1 : 0)
                    stringsConfig.push({ stringNum: i, modulesCount: modulesForThisString })
                }
                
                console.log("✅ Distribution auto créée:", stringsConfig)
                alert("STATS DISTRIBUTION AUTO CRÉÉE:" + String.fromCharCode(10,10) + calculatedStrings + " strings détectés" + String.fromCharCode(10) + baseModulesPerString + "-" + (baseModulesPerString + 1) + " modules/string" + String.fromCharCode(10) + "Total: " + totalModules + " modules" + String.fromCharCode(10,10) + "Vous pourrez ajuster après placement!")
            } else {
                totalModules = stringsConfig.reduce((sum, config) => sum + config.modulesCount, 0)
            }
            
            const moduleWidth = 1.7
            const moduleHeight = 1.0
            const spacing = 0.02
            
            const bounds = roofPolygon.getBounds()
            
            // AMÉLIORATION : Aligner grille sur coin nord-ouest du polygone (au lieu de centrer)
            const startLat = bounds.getNorth() // Latitude maximale (nord)
            const startLng = bounds.getWest()  // Longitude minimale (ouest)
            
            console.log(" Bounds polygone:", {
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest()
            })
            console.log(" Point de départ grille (NW):", startLat, startLng)
            
            // Préparer polygone Turf.js
            const coords = roofPolygon.getLatLngs()[0].map(ll => [ll.lng, ll.lat])
            if (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1]) {
                coords.push([...coords[0]])
            }
            const poly = turf.polygon([coords])
            
            modules = []
            let moduleNum = 1
            let currentRow = 0
            let modulesPlacedInString = 0
            let currentStringIndex = 0
            let currentStringConfig = stringsConfig[currentStringIndex]
            
            console.log("Centre Début placement intelligent - Total à placer:", totalModules)
            
            // REMPLISSAGE INTELLIGENT RANGÉE PAR RANGÉE
            const maxRows = 100 // Limite sécurité
            
            while (moduleNum <= totalModules && currentRow < maxRows) {
                let col = 0
                let modulesInRow = 0
                const rowLat = startLat - (currentRow * (moduleHeight + spacing)) / 111320
                
                // Si on a terminé le string actuel, passer au suivant
                if (currentStringConfig && modulesPlacedInString >= currentStringConfig.modulesCount) {
                    currentStringIndex++
                    currentStringConfig = stringsConfig[currentStringIndex]
                    modulesPlacedInString = 0
                    console.log( "✅ String " + (currentStringIndex) + " terminé, passage au string " + (currentStringIndex + 1))
                }
                
                if (!currentStringConfig) break // Plus de strings à placer
                
                // Parcourir la rangée de gauche à droite
                while (modulesInRow < 200) { // Limite sécurité colonnes
                    const moduleLng = startLng + (col * (moduleWidth + spacing)) / (111320 * Math.cos(rowLat * Math.PI / 180))
                    
                    // Vérifier les 4 coins + centre du module
                    const halfLatModule = (moduleHeight / 2) / 111320
                    const halfLngModule = (moduleWidth / 2) / (111320 * Math.cos(rowLat * Math.PI / 180))
                    
                    const centerPoint = turf.point([moduleLng, rowLat])
                    const topLeft = turf.point([moduleLng - halfLngModule, rowLat + halfLatModule])
                    const topRight = turf.point([moduleLng + halfLngModule, rowLat + halfLatModule])
                    const bottomLeft = turf.point([moduleLng - halfLngModule, rowLat - halfLatModule])
                    const bottomRight = turf.point([moduleLng + halfLngModule, rowLat - halfLatModule])
                    
                    // Module valide si TOUS les coins sont dans le polygone
                    const allCornersInside = 
                        turf.booleanPointInPolygon(centerPoint, poly) &&
                        turf.booleanPointInPolygon(topLeft, poly) &&
                        turf.booleanPointInPolygon(topRight, poly) &&
                        turf.booleanPointInPolygon(bottomLeft, poly) &&
                        turf.booleanPointInPolygon(bottomRight, poly)
                    
                    if (allCornersInside && modulesPlacedInString < currentStringConfig.modulesCount) {
                        modules.push({
                            id: null,
                            zone_id: parseInt(zoneId),
                            module_identifier: "M" + moduleNum,
                            latitude: rowLat,
                            longitude: moduleLng,
                            pos_x_meters: col * (moduleWidth + spacing),
                            pos_y_meters: currentRow * (moduleHeight + spacing),
                            width_meters: moduleWidth,
                            height_meters: moduleHeight,
                            rotation: currentRotation,
                            string_number: currentStringConfig.stringNum,
                            position_in_string: modulesPlacedInString + 1,
                            power_wp: 450,
                            module_status: "pending",
                            status_comment: null
                        })
                        moduleNum++
                        modulesPlacedInString++
                        modulesInRow++
                    }
                    
                    col++
                    
                    // Si on sort complètement du polygone, passer rangée suivante
                    if (moduleLng > bounds.getEast()) break
                }
                
                currentRow++
                console.log( "Tech Rangée " + currentRow + " : " + modulesInRow + " modules placés")
                
                // Si aucun module placé dans cette rangée, on a fini
                if (modulesInRow === 0) {
                    console.log( "ATTENTION Aucun module dans rangée " + currentRow + " - fin placement")
                    break
                }
            }
            
            console.log( "✅ Placement terminé : " + modules.length + " modules sur " + totalModules + " demandés")
            
            nextModuleNum = moduleNum
            renderModules()
            updateStats()
            updateStringsProgress()  // Mettre a jour progression
            const stringsDetail = stringsConfig.map(c => "String " + c.stringNum + ": " + c.modulesCount + " modules").join(String.fromCharCode(10))
            alert("OK: " + modules.length + " modules places!" + String.fromCharCode(10,10) + stringsDetail)
        })
        */
        
        function placeModuleManual() {
            // MODE HYBRIDE : Config optionnelle + auto-configuration
            const totalConfigured = stringsConfig.length > 0 ? stringsConfig.reduce((sum, s) => sum + s.modulesCount, 0) : Infinity
            
            // Si config existe, valider limite
            if (stringsConfig.length > 0 && modules.length >= totalConfigured) {
                alert(String.fromCharCode(0x1F6D1) + " LIMITE ATTEINTE" + String.fromCharCode(10,10) + "Config: " + totalConfigured + " modules" + String.fromCharCode(10) + "Placés: " + modules.length + " modules" + String.fromCharCode(10,10) + "Impossible de placer plus de modules!")
                return
            }
            
            placementMode = "manual"
            const msg = stringsConfig.length > 0 
                ? "Cliquez sur la carte pour placer des modules" + String.fromCharCode(10,10) + "Restant: " + (totalConfigured - modules.length) + "/" + totalConfigured + " modules"
                : "Cliquez sur la carte pour placer des modules" + String.fromCharCode(10,10) + "Mode libre : La config se mettra à jour automatiquement"
            alert(msg)
            
            map.once('click', (e) => {
                if (placementMode !== "manual") return
                
                // Déterminer string et position en fonction de stringsConfig
                let stringNum = 1
                let posInString = 1
                
                if (stringsConfig.length > 0) {
                    let accumulatedModules = 0
                    for (let i = 0; i < stringsConfig.length; i++) {
                        const config = stringsConfig[i]
                        if (nextModuleNum <= accumulatedModules + config.modulesCount) {
                            stringNum = config.stringNum
                            posInString = nextModuleNum - accumulatedModules
                            break
                        }
                        accumulatedModules += config.modulesCount
                    }
                } else {
                    // Fallback si pas de config strings
                    const modulesPerString = 10 // Valeur par défaut
                    stringNum = Math.floor((nextModuleNum - 1) / modulesPerString) + 1
                    posInString = ((nextModuleNum - 1) % modulesPerString) + 1
                }
                
                modules.push({
                    id: null,
                    zone_id: parseInt(zoneId),
                    module_identifier: "M" + nextModuleNum,
                    latitude: e.latlng.lat,
                    longitude: e.latlng.lng,
                    pos_x_meters: 0,
                    pos_y_meters: 0,
                    width_meters: 1.7,
                    height_meters: 1.0,
                    rotation: currentRotation,
                    string_number: stringNum,
                    position_in_string: posInString,
                    power_wp: 450,
                    module_status: "pending",
                    status_comment: null
                })
                
                nextModuleNum++
                renderModules()
                updateStats()
                
                // SYNC BIDIRECTIONNELLE : Mettre à jour config auto si mode libre
                if (stringsConfig.length === 0) {
                    autoConfigureFromModules()
                }
                
                updateStringsProgress()  // Mettre à jour progression
                
                // Continuer placement
                const totalConfigured = stringsConfig.length > 0 ? stringsConfig.reduce((sum, s) => sum + s.modulesCount, 0) : Infinity
                if (stringsConfig.length === 0 || modules.length < totalConfigured) {
                    placeModuleManual()
                } else {
                    alert(String.fromCharCode(0x2705) + " LIMITE ATTEINTE" + String.fromCharCode(10,10) + "Tous les modules configurés ont été placés (" + totalConfigured + "/" + totalConfigured + ")")
                }
            })
        }
        
        function drawRowMode() {
            if (!roofPolygon) {
                alert("ATTENTION: Dessinez d" + String.fromCharCode(39) + "abord le contour de toiture!")
                return
            }
            
            // MODE HYBRIDE : Config optionnelle + auto-configuration
            const totalConfigured = stringsConfig.length > 0 ? stringsConfig.reduce((sum, s) => sum + s.modulesCount, 0) : Infinity
            
            // Si config existe, valider limite
            if (stringsConfig.length > 0 && modules.length >= totalConfigured) {
                alert(String.fromCharCode(0x1F6D1) + " LIMITE ATTEINTE" + String.fromCharCode(10,10) + "Config: " + totalConfigured + " modules" + String.fromCharCode(10) + "Placés: " + modules.length + " modules" + String.fromCharCode(10,10) + "Impossible de placer plus de modules!")
                return
            }
            
            placementMode = "drawRow"
            isDrawingRow = false
            rowStartLatLng = null
            
            alert("MODE DESSIN RANGEE" + String.fromCharCode(10,10) + "1. Cliquez sur point de depart" + String.fromCharCode(10) + "2. Glissez la souris" + String.fromCharCode(10) + "3. Relachez pour creer rangee" + String.fromCharCode(10,10) + "Appuyez sur ESC pour annuler")
            
            // Désactiver événements Leaflet par défaut
            map.dragging.disable()
            map.doubleClickZoom.disable()
            
            // Event listeners
            map.on('mousedown', onRowMouseDown)
            map.on('mousemove', onRowMouseMove)
            map.on('mouseup', onRowMouseUp)
            
            // ESC pour annuler
            document.addEventListener('keydown', onEscapeKey)
        }
        
        function onRowMouseDown(e) {
            if (placementMode !== "drawRow") return
            
            isDrawingRow = true
            rowStartLatLng = e.latlng
            
            // Créer rectangle preview
            rowPreviewRect = L.rectangle([
                [e.latlng.lat, e.latlng.lng],
                [e.latlng.lat, e.latlng.lng]
            ], {
                color: "#22c55e",
                weight: 3,
                fillColor: "#22c55e",
                fillOpacity: 0.2,
                dashArray: "10, 10"
            }).addTo(map)
        }
        
        function onRowMouseMove(e) {
            if (!isDrawingRow || !rowPreviewRect) return
            
            // Mettre à jour rectangle preview
            rowPreviewRect.setBounds([
                [rowStartLatLng.lat, rowStartLatLng.lng],
                [e.latlng.lat, e.latlng.lng]
            ])
        }
        
        function onRowMouseUp(e) {
            if (!isDrawingRow) return
            
            isDrawingRow = false
            
            // Calculer dimensions rectangle en mètres
            const bounds = rowPreviewRect.getBounds()
            const latDiff = Math.abs(bounds.getNorth() - bounds.getSouth())
            const lngDiff = Math.abs(bounds.getEast() - bounds.getWest())
            
            const heightMeters = latDiff * 111320 // 1 degré latitude ≈ 111.32 km
            const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2
            const widthMeters = lngDiff * 111320 * Math.cos(centerLat * Math.PI / 180)
            
            // Dimensions module + espacement
            const moduleWidth = 1.7 + 0.02  // 1.7m + 2cm espacement
            const moduleHeight = 1.0 + 0.02 // 1.0m + 2cm espacement
            
            // Calculer nombre de modules (colonnes x lignes)
            const cols = Math.floor(widthMeters / moduleWidth)
            const rows = Math.floor(heightMeters / moduleHeight)
            const totalModules = cols * rows
            
            if (totalModules === 0) {
                alert("ATTENTION: Rectangle trop petit! Dessinez une zone plus grande.")
                cancelDrawRowMode()
                return
            }
            
            // Confirmation
            const confirmMsg = 'CREATION RANGEE' + String.fromCharCode(10,10) + "Dimensions: " + widthMeters.toFixed(1) + "m x " + heightMeters.toFixed(1) + "m" + String.fromCharCode(10) + "Modules: " + cols + " colonnes x " + rows + " lignes = " + totalModules + " modules" + String.fromCharCode(10,10) + "Creer cette rangee?"
            const confirmed = confirm(confirmMsg)
            
            if (!confirmed) {
                cancelDrawRowMode()
                return
            }
            
            // Générer modules dans le rectangle
            const generatedModules = []
            let moduleNum = nextModuleNum
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    // Calculer position GPS
                    const latOffset = (row * moduleHeight) / 111320
                    const lngOffset = (col * moduleWidth) / (111320 * Math.cos(centerLat * Math.PI / 180))
                    
                    const moduleLat = bounds.getSouth() + latOffset
                    const moduleLng = bounds.getWest() + lngOffset
                    
                    // Vérifier si dans contour toiture
                    const point = turf.point([moduleLng, moduleLat])
                    const coords = roofPolygon.getLatLngs()[0].map(ll => [ll.lng, ll.lat])
                    // Fermer le polygone pour Turf.js
                    if (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1]) {
                        coords.push([...coords[0]])
                    }
                    const polygon = turf.polygon([coords])
                    
                    if (turf.booleanPointInPolygon(point, polygon)) {
                        // Déterminer string et position selon stringsConfig
                        let stringNum = 1
                        let posInString = 1
                        
                        if (stringsConfig.length > 0) {
                            // Calculer l'index relatif du module (0-based)
                            const relativeModuleIndex = generatedModules.length
                            let accumulatedModules = 0
                            
                            for (let i = 0; i < stringsConfig.length; i++) {
                                const config = stringsConfig[i]
                                if (relativeModuleIndex < accumulatedModules + config.modulesCount) {
                                    stringNum = config.stringNum
                                    posInString = relativeModuleIndex - accumulatedModules + 1
                                    break
                                }
                                accumulatedModules += config.modulesCount
                            }
                        }
                        
                        generatedModules.push({
                            id: null,
                            zone_id: parseInt(zoneId),
                            module_identifier: "M" + moduleNum,
                            latitude: moduleLat,
                            longitude: moduleLng,
                            pos_x_meters: 0,
                            pos_y_meters: 0,
                            width_meters: 1.7,
                            height_meters: 1.0,
                            rotation: currentRotation,
                            string_number: stringNum,
                            position_in_string: posInString,
                            power_wp: 450,
                            module_status: "pending",
                            status_comment: null
                        })
                        
                        moduleNum++
                    }
                }
            }
            
            // Debug logs
            console.log(" Modules générés:", generatedModules.length)
            console.log(" Premier module:", generatedModules[0])
            console.log(" Total modules avant:", modules.length)
            
            // Ajouter modules générés
            modules.push(...generatedModules)
            nextModuleNum = moduleNum
            
            console.log(" Total modules après:", modules.length)
            
            // Nettoyer mode dessin
            cancelDrawRowMode()
            
            // Render
            console.log(" Appel renderModules...")
            renderModules()
            console.log(" Appel updateStats...")
            updateStats()
            
            // SYNC BIDIRECTIONNELLE : Mettre à jour config auto si mode libre
            if (stringsConfig.length === 0) {
                autoConfigureFromModules()
            }
            
            updateStringsProgress()  // Mettre à jour progression
            
            const rectInfo = "Rectangle: " + widthMeters.toFixed(1) + "m x " + heightMeters.toFixed(1) + "m" + String.fromCharCode(10) + "Grille: " + cols + " x " + rows; alert("OK: " + generatedModules.length + " modules crees!" + String.fromCharCode(10,10) + rectInfo)
        }
        
        function onEscapeKey(e) {
            if (e.key === "Escape" && placementMode === "drawRow") {
                cancelDrawRowMode()
                alert("Mode dessin rangee annule")
            }
        }
        
        function cancelDrawRowMode() {
            // Nettoyer preview rectangle
            if (rowPreviewRect) {
                map.removeLayer(rowPreviewRect)
                rowPreviewRect = null
            }
            
            // Réactiver Leaflet
            map.dragging.enable()
            map.doubleClickZoom.enable()
            
            // Retirer event listeners
            map.off('mousedown', onRowMouseDown)
            map.off('mousemove', onRowMouseMove)
            map.off('mouseup', onRowMouseUp)
            document.removeEventListener('keydown', onEscapeKey)
            
            // Reset variables
            isDrawingRow = false
            rowStartLatLng = null
            placementMode = "manual"
        }
        
        async function clearModules() {
            console.log("️ clearModules() appelé - Modules actuels:", modules.length)
            
            if (confirm('Effacer tous les modules ?')) {
                console.log("✅ Confirmation utilisateur - Effacement en cours...")
                
                try {
                    // Supprimer de la DB
                    console.log(" DELETE API call...")
                    await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/modules\`, {
                        method: "DELETE"
                    })
                    console.log("✅ DELETE API success")
                    
                    // Supprimer localement
                    modules = []
                    nextModuleNum = 1
                    
                    // Re-render
                    renderModules()
                    updateStats()
                    updateStringsProgress()
                    
                    console.log("✅ Modules effacés - Nouveau total:", modules.length)
                    alert("OK: Tous les modules ont été effacés")
                } catch (error) {
                    console.error('❌ Erreur effacement modules:', error)
                    alert("ERREUR: Impossible d" + String.fromCharCode(39) + "effacer les modules - " + error.message)
                }
            } else {
                console.log("❌ Annulation utilisateur")
            }
        }
        
        function cleanInvalidModules() {
            if (!roofPolygon) {
                alert("ATTENTION Aucune toiture dessinée - impossible de valider les modules")
                return
            }
            
            const before = modules.length
            
            // Préparer polygone Turf.js
            const coords = roofPolygon.getLatLngs()[0].map(ll => [ll.lng, ll.lat])
            if (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1]) {
                coords.push([...coords[0]])
            }
            const poly = turf.polygon([coords])
            
            // Filtrer modules invalides
            const validModules = []
            const invalidModules = []
            
            modules.forEach(m => {
                // Check 1: GPS valide
                if (!m.latitude || !m.longitude) {
                    invalidModules.push({ module: m, reason: "GPS invalide" })
                    return
                }
                
                // Check 2: Centre dans polygone
                const centerPoint = turf.point([m.longitude, m.latitude])
                if (!turf.booleanPointInPolygon(centerPoint, poly)) {
                    invalidModules.push({ module: m, reason: "Hors toiture (centre)" })
                    return
                }
                
                // Check 3: Les 4 coins dans polygone (validation stricte)
                const moduleWidth = m.width_meters || 1.7
                const moduleHeight = m.height_meters || 1.0
                
                const halfLatModule = (moduleHeight / 2) / 111320
                const halfLngModule = (moduleWidth / 2) / (111320 * Math.cos(m.latitude * Math.PI / 180))
                
                const topLeft = turf.point([m.longitude - halfLngModule, m.latitude + halfLatModule])
                const topRight = turf.point([m.longitude + halfLngModule, m.latitude + halfLatModule])
                const bottomLeft = turf.point([m.longitude - halfLngModule, m.latitude - halfLatModule])
                const bottomRight = turf.point([m.longitude + halfLngModule, m.latitude - halfLatModule])
                
                const allCornersInside = 
                    turf.booleanPointInPolygon(topLeft, poly) &&
                    turf.booleanPointInPolygon(topRight, poly) &&
                    turf.booleanPointInPolygon(bottomLeft, poly) &&
                    turf.booleanPointInPolygon(bottomRight, poly)
                
                if (!allCornersInside) {
                    invalidModules.push({ module: m, reason: "Hors toiture (coins)" })
                    return
                }
                
                // Module valide
                validModules.push(m)
            })
            
            modules = validModules
            const removed = before - modules.length
            
            console.log( " Nettoyage: " + removed + " modules invalides supprimés (" + modules.length + " restants)")
            console.log("DOCS Détail modules supprimés:", invalidModules)
            
            renderModules()
            updateStats()
            updateStringsProgress()
            
            if (removed > 0) {
                const msg = " NETTOYAGE TERMINÉ" + String.fromCharCode(10,10) +
                    removed + " modules supprimés" + String.fromCharCode(10) +
                    modules.length + " modules valides restants" + String.fromCharCode(10,10) +
                    "Raisons:" + String.fromCharCode(10) +
                    "  - GPS invalide: " + invalidModules.filter(i => i.reason === "GPS invalide").length + String.fromCharCode(10) +
                    "  - Hors toiture: " + invalidModules.filter(i => i.reason.startsWith("Hors")).length
                alert(msg)
            } else {
                alert("✅ Aucun module invalide trouvé" + String.fromCharCode(10) + "Tous les modules sont correctement positionnés")
            }
        }
        
        // ================================================================
        // GESTION RECTANGLES MODULES
        // ================================================================
        function createModuleRectangle() {
            if (!roofPolygon) {
                alert("ATTENTION Dessinez d" + String.fromCharCode(39) + "abord la toiture !")
                return
            }
            
            const rows = parseInt(document.getElementById('rectRows').value) || 5
            const cols = parseInt(document.getElementById('rectCols').value) || 24
            const stringStart = parseInt(document.getElementById('rectString').value) || 1
            const alignment = document.getElementById('rectAlignment').value || 'center'
            
            // *** NOUVELLE MÉTHODE PIXEL-BASED (comme SolarEdge) ***
            const moduleWidth = 1.7   // m
            const moduleHeight = 1.0  // m
            const spacing = 0.02      // m entre modules
            
            const totalWidthMeters = cols * moduleWidth + (cols - 1) * spacing
            const totalHeightMeters = rows * moduleHeight + (rows - 1) * spacing
            
            console.log(" Rectangle réel:", totalWidthMeters.toFixed(1) + "m x " + totalHeightMeters.toFixed(1) + "m")
            console.log(" Alignement:", alignment)
            
            // Convertir mètres  pixels selon zoom actuel
            const zoom = map.getZoom()
            
            // *** NOUVEAU : Positionner selon alignement choisi ***
            const roofBounds = roofPolygon.getBounds()
            let anchorLat, anchorLng
            
            switch(alignment) {
                case 'north':
                    anchorLat = roofBounds.getNorth()
                    anchorLng = (roofBounds.getWest() + roofBounds.getEast()) / 2
                    console.log("Nord Alignement NORD")
                    break
                case 'south':
                    anchorLat = roofBounds.getSouth()
                    anchorLng = (roofBounds.getWest() + roofBounds.getEast()) / 2
                    console.log("Sud️ Alignement SUD")
                    break
                case 'east':
                    anchorLat = (roofBounds.getNorth() + roofBounds.getSouth()) / 2
                    anchorLng = roofBounds.getEast()
                    console.log("Est️ Alignement EST")
                    break
                case 'west':
                    anchorLat = (roofBounds.getNorth() + roofBounds.getSouth()) / 2
                    anchorLng = roofBounds.getWest()
                    console.log("Ouest️ Alignement OUEST")
                    break
                case 'nw':
                    anchorLat = roofBounds.getNorth()
                    anchorLng = roofBounds.getWest()
                    console.log("↖️ Alignement NORD-OUEST")
                    break
                case 'ne':
                    anchorLat = roofBounds.getNorth()
                    anchorLng = roofBounds.getEast()
                    console.log("NE️ Alignement NORD-EST")
                    break
                case 'sw':
                    anchorLat = roofBounds.getSouth()
                    anchorLng = roofBounds.getWest()
                    console.log("SW️ Alignement SUD-OUEST")
                    break
                case 'se':
                    anchorLat = roofBounds.getSouth()
                    anchorLng = roofBounds.getEast()
                    console.log("SE️ Alignement SUD-EST")
                    break
                default: // center
                    anchorLat = roofBounds.getCenter().lat
                    anchorLng = roofBounds.getCenter().lng
                    console.log("Centre Alignement CENTRE")
            }
            
            const center = L.latLng(anchorLat, anchorLng)
            console.log(" Point ancrage:", center.lat.toFixed(6) + ", " + center.lng.toFixed(6))
            
            // Formule Leaflet: mètres par pixel selon zoom
            const metersPerPixel = 156543.03392 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom)
            const pixelsPerMeter = 1 / metersPerPixel
            
            console.log(" Zoom:", zoom, "| Pixels/mètre:", pixelsPerMeter.toFixed(2))
            
            // Taille rectangle en pixels
            const totalWidthPixels = totalWidthMeters * pixelsPerMeter
            const totalHeightPixels = totalHeightMeters * pixelsPerMeter
            
            console.log("Tech Pixels:", totalWidthPixels.toFixed(0) + "px x " + totalHeightPixels.toFixed(0) + "px")
            
            // Convertir centre map en pixels
            const centerPoint = map.latLngToContainerPoint(center)
            
            // Calculer coins du rectangle en pixels
            const topLeftPoint = L.point(
                centerPoint.x - totalWidthPixels / 2,
                centerPoint.y - totalHeightPixels / 2
            )
            const bottomRightPoint = L.point(
                centerPoint.x + totalWidthPixels / 2,
                centerPoint.y + totalHeightPixels / 2
            )
            
            // Convertir pixels  LatLng
            const topLeft = map.containerPointToLatLng(topLeftPoint)
            const bottomRight = map.containerPointToLatLng(bottomRightPoint)
            
            const bounds = [topLeft, bottomRight]
            
            console.log(" Bounds GPS:", bounds)
            
            // Create rectangle
            const id = moduleRectangles.length + 1
            const rect = new RectangleModuleGroup(id, rows, cols, stringStart, bounds)
            rect.addToMap()
            
            moduleRectangles.push(rect)
            
            // Update UI
            updateRectanglesList()
            applyRectanglesToModules()
            
            // CRITIQUE: Forcer fix IMMÉDIATEMENT après création
            setTimeout(() => {
                fixRectanglesOnMap()
                // Afficher les handles du rectangle nouvellement créé
                rect.showHandles()
            }, 100)
            
            alert("✅ Rectangle créé: " + (rows * cols) + " modules" + String.fromCharCode(10) + "Déplacez et redimensionnez avec les poignées")
        }
        
        function applyRectanglesToModules() {
            // Collect all modules from all rectangles
            modules = []
            
            moduleRectangles.forEach(rect => {
                modules = modules.concat(rect.modules)
            })
            
            console.log(" Modules totaux depuis rectangles:", modules.length)
            
            renderModules()
            updateStats()
            updateStringsProgress()
        }
        
        // ================================================================
        // IMPORT DEPUIS MODULE EL - SYSTÈME DYNAMIQUE
        // ================================================================
        
        // Ouvrir modal sélection audit EL
        async function openImportELModal() {
            if (!roofPolygon) {
                // // alert("Creez d'abord un polygone de toiture (Étape 0)")
                return
            }
            
            const modal = document.getElementById('importELModal')
            const container = document.getElementById('auditListContainer')
            
            if (!modal || !container) return
            
            modal.classList.remove('hidden')
            container.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-3xl mb-2"></i><p>Chargement des audits EL...</p></div>'
            
            try {
                // Récupérer liste des audits EL disponibles
                const response = await fetch('/api/pv/available-el-audits')
                const data = await response.json()
                
                if (!data.success || !data.audits || data.audits.length === 0) {
                    container.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-inbox text-3xl mb-2"></i><p>Aucun audit EL disponible</p><p class="text-xs mt-2">Créez dabord des audits dans Module EL</p></div>'
                    return
                }
                
                // Afficher la liste des audits
                container.innerHTML = data.audits.map(audit => {
                    const configData = audit.configuration_json ? JSON.parse(audit.configuration_json) : null
                    const rectanglesCount = configData?.rectangles?.length || 1
                    const linkedBadge = audit.is_linked > 0 ? '<span class="ml-2 px-2 py-1 bg-green-600 rounded text-xs">DÉJÀ LIÉ</span>' : ''
                    
                    return '<div class="audit-item bg-gray-800 border border-gray-700 hover:border-purple-400 rounded-lg p-4 cursor-pointer transition-all" ' +
                             'data-audit-id="' + audit.id + '" ' +
                             'data-audit-token="' + audit.audit_token + '" ' +
                             'data-string-count="' + audit.string_count + '" ' +
                             'data-modules-per-string="' + audit.modules_per_string + '" ' +
                             'onclick="selectAuditForImport(this.dataset.auditToken, parseInt(this.dataset.stringCount), parseInt(this.dataset.modulesPerString))\">' +
                            '<div class="flex items-start justify-between">' +
                                '<div class="flex-1">' +
                                    '<h4 class="font-bold text-lg text-purple-400 mb-1">' +
                                        '<i class="fas fa-file-alt mr-2"></i>' + audit.project_name +
                                        linkedBadge +
                                    '</h4>' +
                                    '<p class="text-sm text-gray-400 mb-2">' +
                                        '<i class="fas fa-user mr-2"></i>' + audit.client_name +
                                        (audit.location ? ' \u2022 ' + audit.location : '') +
                                    '</p>' +
                                    '<div class="grid grid-cols-5 gap-3 text-xs">' +
                                        '<div class="bg-black rounded p-2 text-center">' +
                                            '<div class="text-xl font-bold text-purple-400">' + audit.total_modules + '</div>' +
                                            '<div class="text-gray-500">Modules</div>' +
                                        '</div>' +
                                        '<div class="bg-black rounded p-2 text-center">' +
                                            '<div class="text-xl font-bold text-blue-400">' + audit.string_count + '</div>' +
                                            '<div class="text-gray-500">Strings</div>' +
                                        '</div>' +
                                        '<div class="bg-black rounded p-2 text-center">' +
                                            '<div class="text-lg font-bold text-cyan-400">' + audit.string_count + '×' + audit.modules_per_string + '</div>' +
                                            '<div class="text-gray-500">Config</div>' +
                                        '</div>' +
                                        '<div class="bg-black rounded p-2 text-center">' +
                                            '<div class="text-xl font-bold text-orange-400">' + rectanglesCount + '</div>' +
                                            '<div class="text-gray-500">Rectangles</div>' +
                                        '</div>' +
                                        '<div class="bg-black rounded p-2 text-center">' +
                                            '<div class="text-xl font-bold ' + (audit.modules_with_defects > 0 ? 'text-red-400' : 'text-green-400') + '">' + (audit.modules_with_defects || 0) + '</div>' +
                                            '<div class="text-gray-500">Défauts</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="mt-3 flex flex-wrap items-center gap-2 text-xs">' +
                                        '<span class="px-2 py-1 bg-purple-900/50 border border-purple-500/30 rounded">' +
                                            '<i class="fas fa-calendar mr-1 text-purple-400"></i>' + new Date(audit.created_at).toLocaleDateString('fr-FR') +
                                        '</span>' +
                                        '<span class="px-2 py-1 bg-blue-900/50 border border-blue-500/30 rounded">' +
                                            '<i class="fas fa-tasks mr-1 text-blue-400"></i>' + (audit.completion_rate || 0).toFixed(0) + '% complet' +
                                        '</span>' +
                                        (audit.modules_with_defects > 0 ? 
                                            '<span class="px-2 py-1 bg-red-900/50 border border-red-500/30 rounded">' +
                                                '<i class="fas fa-exclamation-triangle mr-1 text-red-400"></i>' + audit.modules_with_defects + ' d\u00e9faut(s) d\u00e9tect\u00e9(s)' +
                                            '</span>' : 
                                            '<span class="px-2 py-1 bg-green-900/50 border border-green-500/30 rounded">' +
                                                '<i class="fas fa-check-circle mr-1 text-green-400"></i>Aucun d\u00e9faut' +
                                            '</span>') +
                                    '</div>' +
                                '</div>' +
                                '<div class="ml-4">' +
                                    '<button class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold">' +
                                        '<i class="fas fa-download mr-2"></i>IMPORTER' +
                                    '</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>'
                }).join('')
                
                console.log("✅ Liste audits EL chargée:", data.audits.length, "audits")
                
            } catch (error) {
                console.error("Erreur chargement audits EL:", error)
                container.innerHTML = '<div class="text-center py-8 text-red-400"><i class="fas fa-exclamation-triangle text-3xl mb-2"></i><p>Erreur chargement audits</p></div>'
            }
        }
        
        // Sélectionner et importer un audit EL
        async function selectAuditForImport(auditToken, stringCount, modulesPerString) {
            const totalModules = stringCount * modulesPerString
            if (!confirm("Importer cet audit EL ? (" + stringCount + " strings x " + modulesPerString + " modules = " + totalModules + " modules total)")) {
                return
            }
            
            try {
                console.log("🚀 Import audit EL:", auditToken)
                
                // Fermer modal
                document.getElementById('importELModal').classList.add('hidden')
                
                // Calculer configuration: 1 rectangle avec tous les modules
                const rows = stringCount
                const cols = modulesPerString
                const totalModules = rows * cols
                
                console.log("Configuration: " + cols + " colonnes x " + rows + " rangées = " + totalModules + " modules")
                
                // Paramètres globaux
                const roofBounds = roofPolygon.getBounds()
                const roofCenter = roofBounds.getCenter()
                const zoom = map.getZoom()
                const moduleWidth = 1.7   // LANDSCAPE: largeur
                const moduleHeight = 1.13  // LANDSCAPE: hauteur
                const spacing = 0.01       // Espacement entre modules
                
                const metersPerPixel = 156543.03392 * Math.cos(roofCenter.lat * Math.PI / 180) / Math.pow(2, zoom)
                const pixelsPerMeter = 1 / metersPerPixel
                
                // Calculer dimensions réelles du polygone de toiture
                const roofNorth = roofBounds.getNorth()
                const roofSouth = roofBounds.getSouth()
                const roofEast = roofBounds.getEast()
                const roofWest = roofBounds.getWest()
                
                const roofWidthDegrees = roofEast - roofWest
                const roofHeightDegrees = roofNorth - roofSouth
                const roofWidthMeters = roofWidthDegrees * 111320 * Math.cos(roofCenter.lat * Math.PI / 180)
                const roofHeightMeters = roofHeightDegrees * 110574
                
                console.log("Toiture: " + roofWidthMeters.toFixed(1) + "m x " + roofHeightMeters.toFixed(1) + "m")
                
                // Calculer dimensions nécessaires pour l'array
                const arrayWidthNeeded = cols * moduleWidth + (cols - 1) * spacing
                const arrayHeightNeeded = rows * moduleHeight + (rows - 1) * spacing
                
                console.log("Array nécessaire: " + arrayWidthNeeded.toFixed(1) + "m x " + arrayHeightNeeded.toFixed(1) + "m")
                
                // ÉCHELLE ADAPTATIVE (92% de la toiture)
                const widthScale = roofWidthMeters / arrayWidthNeeded
                const heightScale = roofHeightMeters / arrayHeightNeeded
                const scaleFactor = Math.min(widthScale, heightScale, 1.0)
                
                console.log("Scale factor: " + scaleFactor.toFixed(3) + " (" + (scaleFactor * 100).toFixed(1) + "%)")
                
                // Calculer dimensions finales avec scale
                const rectWidthMeters = arrayWidthNeeded * scaleFactor
                const rectHeightMeters = arrayHeightNeeded * scaleFactor
                
                // Convertir en degrés GPS
                const rectWidthDegrees = rectWidthMeters / (111320 * Math.cos(roofCenter.lat * Math.PI / 180))
                const rectHeightDegrees = rectHeightMeters / 110574
                
                // Centrer sur la toiture
                const centerLat = (roofNorth + roofSouth) / 2
                const centerLng = (roofWest + roofEast) / 2
                
                const topLeft = L.latLng(
                    centerLat + (rectHeightDegrees / 2),
                    centerLng - (rectWidthDegrees / 2)
                )
                const bottomRight = L.latLng(
                    centerLat - (rectHeightDegrees / 2),
                    centerLng + (rectWidthDegrees / 2)
                )
                const bounds = [topLeft, bottomRight]
                
                // Créer le rectangle unique
                const rectId = moduleRectangles.length + 1
                const rect = new RectangleModuleGroup(rectId, rows, cols, 1, bounds)
                rect.addToMap()
                
                moduleRectangles.push(rect)
                
                // CRITIQUE: Forcer fix après ajout pour garantir visibilité
                setTimeout(() => {
                    fixRectanglesOnMap()
                    rect.showHandles()
                }, 100)
                
                console.log("✅ Rectangle créé: " + cols + "x" + rows + " = " + totalModules + " modules")
                
                updateRectanglesList()
                applyRectanglesToModules()
                
                // Afficher panneau aide alignement
                const helpPanel = document.getElementById('alignmentHelp')
                if (helpPanel) {
                    helpPanel.classList.remove('hidden')
                }
                
                alert(
                    "IMPORT AUDIT EL TERMINÉ" + String.fromCharCode(10,10) +
                    "Audit: " + auditToken + String.fromCharCode(10) +
                    "1 rectangle créé:" + String.fromCharCode(10) +
                    "   - " + cols + " colonnes x " + rows + " rangées" + String.fromCharCode(10) +
                    "   - Orientation LANDSCAPE (1.7m x 1.13m)" + String.fromCharCode(10,10) +
                    "Total: " + totalModules + " modules" + String.fromCharCode(10) +
                    "Dimensions: " + rectWidthMeters.toFixed(1) + "m x " + rectHeightMeters.toFixed(1) + "m" + String.fromCharCode(10) +
                    "Échelle: " + (scaleFactor * 100).toFixed(1) + "%" + String.fromCharCode(10,10) +
                    "PROCHAINE ÉTAPE:" + String.fromCharCode(10) +
                    "Ajustez visuellement le rectangle pour" + String.fromCharCode(10) +
                    "correspondre à la photo satellite !"
                )
                
            } catch (error) {
                console.error("❌ Erreur import audit EL:", error)
                alert("ERREUR IMPORT AUDIT EL" + String.fromCharCode(10,10) + error.message)
            }
        }
        
        // Fonction legacy import 242 (conservée pour compatibilité)
        async function import242SingleArray() {
            if (!roofPolygon) {
                // alert("Creez d'abord un polygone de toiture (Etape 0)")
                return
            }
            
            if (!confirm("Importer 242 modules (22 cols x 11 rows) en 1 rectangle ? Cela va creer un array LANDSCAPE unique.")) {
                return
            }
            
            try {
                console.log("Import 242 modules (1 array) demarre...")
                
                // Configuration: 1 seul rectangle de 22x11 = 242 modules
                const rows = 11
                const cols = 22
                const totalModules = rows * cols
                
                console.log("Configuration: " + cols + " colonnes x " + rows + " rangees = " + totalModules + " modules")
                
                // Paramètres globaux
                const roofBounds = roofPolygon.getBounds()
                const roofCenter = roofBounds.getCenter()
                const zoom = map.getZoom()
                const moduleWidth = 1.7   // LANDSCAPE: largeur
                const moduleHeight = 1.13  // LANDSCAPE: hauteur
                const spacing = 0.01       // Espacement entre modules
                
                const metersPerPixel = 156543.03392 * Math.cos(roofCenter.lat * Math.PI / 180) / Math.pow(2, zoom)
                const pixelsPerMeter = 1 / metersPerPixel
                
                // Calculer dimensions réelles du polygone de toiture
                const roofNorth = roofBounds.getNorth()
                const roofSouth = roofBounds.getSouth()
                const roofEast = roofBounds.getEast()
                const roofWest = roofBounds.getWest()
                
                const roofWidthDegrees = roofEast - roofWest
                const roofHeightDegrees = roofNorth - roofSouth
                const roofWidthMeters = roofWidthDegrees * 111320 * Math.cos(roofCenter.lat * Math.PI / 180)
                const roofHeightMeters = roofHeightDegrees * 110574
                
                console.log("Toiture: " + roofWidthMeters.toFixed(1) + "m x " + roofHeightMeters.toFixed(1) + "m")
                
                // Calculer dimensions nécessaires pour l'array
                const arrayWidthNeeded = cols * moduleWidth + (cols - 1) * spacing
                const arrayHeightNeeded = rows * moduleHeight + (rows - 1) * spacing
                
                console.log("Array necessaire: " + arrayWidthNeeded.toFixed(1) + "m x " + arrayHeightNeeded.toFixed(1) + "m")
                
                // ÉCHELLE ADAPTATIVE (92% de la toiture)
                const widthScale = roofWidthMeters / arrayWidthNeeded
                const heightScale = roofHeightMeters / arrayHeightNeeded
                const scaleFactor = Math.min(widthScale, heightScale, 1.0)
                
                console.log("Scale factor: " + scaleFactor.toFixed(3) + " (" + (scaleFactor * 100).toFixed(1) + "%)")
                
                // Calculer dimensions finales avec scale
                const rectWidthMeters = arrayWidthNeeded * scaleFactor
                const rectHeightMeters = arrayHeightNeeded * scaleFactor
                
                // Convertir en degrés GPS
                const rectWidthDegrees = rectWidthMeters / (111320 * Math.cos(roofCenter.lat * Math.PI / 180))
                const rectHeightDegrees = rectHeightMeters / 110574
                
                // Centrer sur la toiture avec marge 4%
                const marginMeters = roofWidthMeters * 0.04
                const marginLatDegrees = marginMeters / 110574
                const marginLngDegrees = marginMeters / (111320 * Math.cos(roofCenter.lat * Math.PI / 180))
                
                // Calculer position centree
                const centerLat = (roofNorth + roofSouth) / 2
                const centerLng = (roofWest + roofEast) / 2
                
                const topLeft = L.latLng(
                    centerLat + (rectHeightDegrees / 2),
                    centerLng - (rectWidthDegrees / 2)
                )
                const bottomRight = L.latLng(
                    centerLat - (rectHeightDegrees / 2),
                    centerLng + (rectWidthDegrees / 2)
                )
                const bounds = [topLeft, bottomRight]
                
                // Créer le rectangle unique
                const rectId = moduleRectangles.length + 1
                const rect = new RectangleModuleGroup(rectId, rows, cols, 1, bounds)
                rect.addToMap()
                
                moduleRectangles.push(rect)
                
                // CRITIQUE: Forcer fix après ajout pour garantir visibilité
                setTimeout(() => {
                    fixRectanglesOnMap()
                    // Activer handles après fix
                    rect.showHandles()
                }, 100)
                
                console.log("Rectangle cree: " + cols + "x" + rows + " = " + totalModules + " modules")
                
                updateRectanglesList()
                applyRectanglesToModules()
                
                // IMPORTANT: Forcer fix du rectangle pour s'assurer qu'il est bien sur la carte
                setTimeout(() => {
                    fixRectanglesOnMap()
                }, 100)
                
                // Afficher panneau aide alignement (sans scroll automatique)
                const helpPanel = document.getElementById('alignmentHelp')
                if (helpPanel) {
                    helpPanel.classList.remove('hidden')
                    // SUPPRIMÉ: scrollIntoView() - agaçant pour l'utilisateur
                    // L'utilisateur peut voir le panneau dans la sidebar sans scroll forcé
                }
                
                alert(
                    "IMPORT 242 MODULES TERMINE" + String.fromCharCode(10,10) +
                    "1 rectangle cree:" + String.fromCharCode(10) +
                    "   - " + cols + " colonnes x " + rows + " rangees" + String.fromCharCode(10) +
                    "   - Orientation LANDSCAPE (1.7m x 1.13m)" + String.fromCharCode(10,10) +
                    "Total: " + totalModules + " modules" + String.fromCharCode(10) +
                    "Dimensions: " + rectWidthMeters.toFixed(1) + "m x " + rectHeightMeters.toFixed(1) + "m" + String.fromCharCode(10) +
                    "Echelle: " + (scaleFactor * 100).toFixed(1) + "%"  + String.fromCharCode(10,10) +
                    "PROCHAINE ETAPE:" + String.fromCharCode(10) +
                    "Ajustez visuellement le rectangle pour" + String.fromCharCode(10) +
                    "correspondre a la photo satellite !" + String.fromCharCode(10,10) +
                    "Voir panneau ALIGNEMENT VISUEL a gauche"
                )
                
            } catch (error) {
                console.error("Erreur import 242:", error)
                alert("ERREUR IMPORT 242" + String.fromCharCode(10,10) + error.message)
            }
        }
        
        function rotateRectangle(id, angleDelta) {
            const rect = moduleRectangles.find(r => r.id === id)
            if (!rect) return
            
            if (rect.rectangle.transform) {
                const currentAngle = rect.rectangle.transform.getRotation() || 0
                const newAngle = currentAngle + angleDelta
                rect.rectangle.transform.rotate(newAngle)
                rect.regenerateModules()
                applyRectanglesToModules()
                console.log("Rectangle", id, "rotation:", newAngle + "deg")
            } else {
                alert("Rotation non disponible - Leaflet Transform non charge")
            }
        }
        
        function deleteRectangle(id) {
            const index = moduleRectangles.findIndex(r => r.id === id)
            if (index === -1) return
            
            if (!confirm( "Supprimer ce rectangle et ses " + (moduleRectangles[index].rows * moduleRectangles[index].cols) + " modules ?")) {
                return
            }
            
            moduleRectangles[index].destroy()
            moduleRectangles.splice(index, 1)
            
            updateRectanglesList()
            applyRectanglesToModules()
        }
        
        function duplicateRectangle(id) {
            const source = moduleRectangles.find(r => r.id === id)
            if (!source) return
            
            const newStringStart = source.stringStart + Math.ceil((source.rows * source.cols) / 24)
            
            const sourceBounds = source.rectangle.getBounds()
            const newBounds = [
                [sourceBounds.getSouth() - 0.0003, sourceBounds.getWest()],
                [sourceBounds.getNorth() - 0.0003, sourceBounds.getEast()]
            ]
            
            const newId = moduleRectangles.length + 1
            const rect = new RectangleModuleGroup(newId, source.rows, source.cols, newStringStart, newBounds)
            rect.addToMap()
            
            moduleRectangles.push(rect)
            
            updateRectanglesList()
            applyRectanglesToModules()
            
            // CRITIQUE: Forcer fix IMMÉDIATEMENT après duplication
            setTimeout(() => {
                fixRectanglesOnMap()
                // Afficher les handles du rectangle dupliqué
                rect.showHandles()
            }, 100)
            
            alert("Rectangle duplique" + String.fromCharCode(10) + "String depart: " + newStringStart)
        }
        
        function resetRectangleRotation(id) {
            const rect = moduleRectangles.find(r => r.id === id)
            if (!rect) return
            
            if (rect.currentRotation === 0 && !rect.rotatedPolygon) {
                alert("Ce rectangle n'a pas de rotation active")
                return
            }
            
            if (confirm("Réinitialiser la rotation du rectangle ?" + String.fromCharCode(10) + "Les modules seront repositionnés")) {
                rect.resetRotation()
                alert("Rotation réinitialisée !" + String.fromCharCode(10) + "Modules repositionnés sans rotation")
            }
        }
        
        // ================================================================
        // SAUVEGARDE / RESTAURATION CONFIG RECTANGLES (localStorage)
        // ================================================================
        function saveRectanglesConfig() {
            try {
                const config = moduleRectangles.map(rect => ({
                    id: rect.id,
                    rows: rect.rows,
                    cols: rect.cols,
                    stringStart: rect.stringStart,
                    rotation: rect.currentRotation || 0,
                    bounds: [
                        [rect.originalBounds.getNorthWest().lat, rect.originalBounds.getNorthWest().lng],
                        [rect.originalBounds.getSouthEast().lat, rect.originalBounds.getSouthEast().lng]
                    ]
                }))
                
                const key = \`rectangles_\${plantId}_\${zoneId}\`
                localStorage.setItem(key, JSON.stringify(config))
                console.log("💾 Config rectangles sauvegardée:", config.length, "rectangles")
            } catch (error) {
                console.error("Erreur sauvegarde rectangles:", error)
            }
        }
        
        function restoreRectanglesConfig() {
            try {
                const key = \`rectangles_\${plantId}_\${zoneId}\`
                const saved = localStorage.getItem(key)
                
                if (!saved) {
                    console.log("Aucune config rectangles sauvegardée")
                    return false
                }
                
                const config = JSON.parse(saved)
                console.log("📂 Restauration config rectangles:", config.length, "rectangles")
                
                // Recréer rectangles avec rotation
                config.forEach(cfg => {
                    const rect = new RectangleModuleGroup(
                        cfg.id,
                        cfg.rows,
                        cfg.cols,
                        cfg.stringStart,
                        cfg.bounds
                    )
                    rect.addToMap()
                    
                    // Appliquer rotation si existe
                    if (cfg.rotation && cfg.rotation !== 0) {
                        setTimeout(() => {
                            rect.rotateRectangle(cfg.rotation)
                            rect.regenerateModules()
                        }, 100)
                    }
                    
                    moduleRectangles.push(rect)
                })
                
                updateRectanglesList()
                applyRectanglesToModules()
                
                return true
            } catch (error) {
                console.error("Erreur restauration rectangles:", error)
                return false
            }
        }
        
        // ================================================================
        // SAUVEGARDE / RESTAURATION CONFIG STRINGS (localStorage + DB)
        // ================================================================
        function saveStringsConfigToLocalStorage() {
            try {
                if (stringsConfig.length === 0) {
                    console.log("⚠️ Config strings vide - pas de sauvegarde localStorage")
                    return
                }
                
                const key = "stringsConfig_" + plantId + "_" + zoneId
                localStorage.setItem(key, JSON.stringify(stringsConfig))
                console.log("💾 Config strings sauvegardée localStorage:", stringsConfig.length, "strings")
            } catch (error) {
                console.error("Erreur sauvegarde strings localStorage:", error)
            }
        }
        
        function restoreStringsConfigFromLocalStorage() {
            try {
                const key = "stringsConfig_" + plantId + "_" + zoneId
                const saved = localStorage.getItem(key)
                
                if (!saved) {
                    console.log("ℹ️ Aucune config strings sauvegardée en localStorage")
                    return false
                }
                
                const config = JSON.parse(saved)
                console.log("📂 Restauration config strings localStorage:", config.length, "strings")
                
                stringsConfig = config
                
                // Mettre à jour affichage summary si existe
                const summaryEl = document.getElementById('stringsSummaryText')
                if (summaryEl && stringsConfig.length > 0) {
                    const total = stringsConfig.reduce((sum, c) => sum + c.modulesCount, 0)
                    const summaryText = stringsConfig.map(c => "S" + c.stringNum + "=" + c.modulesCount).join(", ") + " (Total: " + total + ")"
                    summaryEl.textContent = summaryText
                    document.getElementById('stringsSummary').classList.remove('hidden')
                }
                
                return true
            } catch (error) {
                console.error("Erreur restauration strings localStorage:", error)
                return false
            }
        }
        
        function updateRectanglesList() {
            const container = document.getElementById('rectanglesContainer')
            const listDiv = document.getElementById('rectanglesList')
            
            if (moduleRectangles.length === 0) {
                listDiv.classList.add('hidden')
                return
            }
            
            listDiv.classList.remove('hidden')
            
            let html = ''
            moduleRectangles.forEach(rect => {
                const totalModules = rect.rows * rect.cols
                const powerKwc = (totalModules * 0.45).toFixed(1)
                const stringEnd = rect.stringStart + Math.floor((totalModules - 1) / 24)
                
                html += ('<div class="p-2 bg-black rounded border border-orange-600">' +
                    '<div class="flex justify-between items-center mb-1">' +
                    '<span class="font-bold text-orange-400">Rectangle ' + rect.id + '</span>' +
                    '<div class="flex gap-1">' +
                    '<button onclick="duplicateRectangle(' + rect.id + ')" class="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs" title="Dupliquer">' +
                    '<i class="fas fa-copy"></i>' +
                    '</button>' +
                    '<button onclick="deleteRectangle(' + rect.id + ')" class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs" title="Supprimer">' +
                    '<i class="fas fa-trash"></i>' +
                    '</button>' +
                    '</div>' +
                    '</div>' +
                    '<div class="text-xs text-gray-400">' +
                    rect.rows + ' x ' + rect.cols + ' = ' + totalModules + ' modules<br>' +
                    'Strings ' + rect.stringStart + '-' + stringEnd + ' | ' + powerKwc + ' kWc' +
                    '</div>' +
                    '</div>')
            })
            
            container.innerHTML = html
        }
        
        function toggleRectGridVisibility() {
            showRectGrid = document.getElementById('showRectGrid').checked
            moduleRectangles.forEach(rect => {
                rect.clearVisuals()
                if (showRectGrid) rect.drawGrid()
                if (showRectInfo) rect.updateInfoOverlay()
            })
        }
        
        function toggleModulesVisibility() {
            showModules = document.getElementById('showModules').checked
            console.log(showModules ? "✅ Affichage modules activé" : "❌ Affichage modules désactivé")
            renderModules()
        }
        
        function toggleRectLabelsVisibility() {
            showRectLabels = document.getElementById('showRectLabels').checked
            renderModules()
        }
        
        function toggleRectInfoVisibility() {
            showRectInfo = document.getElementById('showRectInfo').checked
            moduleRectangles.forEach(rect => {
                if (rect.infoMarker) {
                    drawnItems.removeLayer(rect.infoMarker)
                    rect.infoMarker = null
                }
                if (showRectInfo) rect.updateInfoOverlay()
            })
        }
        
        function togglePersistentEditMode() {
            persistentEditMode = !persistentEditMode
            const btn = document.getElementById('togglePersistentEditBtn')
            const indicator = document.getElementById('persistentEditIndicator')
            
            if (persistentEditMode) {
                // Activer mode édition persistante
                btn.className = 'w-full bg-green-600 hover:bg-green-700 py-2 rounded font-bold text-sm mt-2'
                btn.innerHTML = '<i class="fas fa-lock mr-2"></i>MODE ÉDITION CONTINUE'
                indicator.classList.remove('hidden')
                
                // Afficher handles du premier rectangle si existe
                if (moduleRectangles.length > 0) {
                    moduleRectangles[0].showHandles()
                }
                
                console.log("✅ Mode édition persistante ACTIVÉ")
            } else {
                // Désactiver mode édition persistante
                btn.className = 'w-full bg-gray-700 hover:bg-gray-600 py-2 rounded font-bold text-sm mt-2'
                btn.innerHTML = '<i class="fas fa-lock-open mr-2"></i>MODE ÉDITION CONTINUE'
                indicator.classList.add('hidden')
                
                // Cacher tous les handles
                // CRITIQUE: Vérifier que rectangle existe avant appel hideHandles()
                moduleRectangles.forEach(rect => {
                    if (rect.rectangle) {
                        rect.hideHandles()
                    }
                })
                
                console.log("❌ Mode édition persistante DÉSACTIVÉ")
            }
        }
        
        function updateRectTotal() {
            const rows = parseInt(document.getElementById('rectRows').value) || 0
            const cols = parseInt(document.getElementById('rectCols').value) || 0
            document.getElementById('rectTotal').textContent = rows * cols
        }
        
        // ================================================================
        // RENDU MODULES
        // ================================================================
        function renderModules() {
            console.log(" renderModules: Nombre de modules à afficher:", modules.length)
            
            // Toujours nettoyer les modules existants
            drawnItems.eachLayer(layer => {
                if (layer.options.className && layer.options.className.startsWith('module-')) {
                    drawnItems.removeLayer(layer)
                }
            })
            
            // Si showModules est false, ne rien afficher
            if (!showModules) {
                console.log("⚠️ Affichage modules désactivé (showModules = false)")
                return
            }
            
            modules.forEach((module, index) => {
                // Ignorer modules sans coordonnées GPS valides
                if (!module.latitude || !module.longitude || module.latitude === null || module.longitude === null) {
                    console.warn('ATTENTION Module ignoré (pas de GPS):', module.module_identifier)
                    return
                }
                
                console.log( " Render module " + (index + 1) + ":", module.module_identifier, "at", module.latitude, module.longitude)
                const color = STATUS_COLORS[module.module_status] || STATUS_COLORS.pending
                
                // CRITIQUE: Utiliser moduleCorners pour polygon pivoté, sinon rectangle axis-aligned
                let rect
                if (module.moduleCorners && module.moduleCorners.length === 4) {
                    // Module pivoté → dessiner polygon avec 4 coins
                    rect = L.polygon(module.moduleCorners, {
                        color: color,
                        weight: 2,
                        fillColor: color,
                        fillOpacity: 0.7,
                        className: "module-" + module.module_status,
                        interactive: true
                    })
                } else if (module.moduleBounds) {
                    // Bounds classiques (rectangle non pivoté)
                    rect = L.rectangle(module.moduleBounds, {
                        color: color,
                        weight: 2,
                        fillColor: color,
                        fillOpacity: 0.7,
                        className: "module-" + module.module_status,
                        interactive: true
                    })
                } else {
                    // Calcul classique GPS pour modules placés manuellement
                    const latOffset = module.height_meters / 111320 / 2
                    const lngOffset = module.width_meters / (111320 * Math.cos(module.latitude * Math.PI / 180)) / 2
                    
                    const bounds = [
                        [module.latitude - latOffset, module.longitude - lngOffset],
                        [module.latitude + latOffset, module.longitude + lngOffset]
                    ]
                    
                    rect = L.rectangle(bounds, {
                        color: color,
                        weight: 2,
                        fillColor: color,
                        fillOpacity: 0.7,
                        className: "module-" + module.module_status,
                        interactive: true
                    })
                }
                
                // Ajouter label texte au centre du module (format: S1-P15)
                const labelText = 'S' + module.string_number + "-P" + (module.position_in_string < 10 ? '0' : '') + module.position_in_string
                
                // Seulement afficher labels si showRectLabels est true (pour rectangles) ou si pas dans rectangle
                const shouldShowLabel = !module.rectangleId || showRectLabels
                
                if (shouldShowLabel) {
                    const moduleLabel = L.marker([module.latitude, module.longitude], {
                        icon: L.divIcon({
                            className: 'module-label',
                            html: '<div style="background: rgba(0,0,0,0.85); color: white; padding: 3px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; white-space: nowrap; border: 1px solid rgba(255,255,255,0.3);">' + labelText + '</div>',
                            iconSize: [45, 16],
                            iconAnchor: [22, 8]
                        }),
                        interactive: false  // Ne pas capturer les clics (laisser passer au rectangle en dessous)
                    })
                    moduleLabel.addTo(drawnItems)
                }
                
                rect.bindPopup(
                    '<strong>' + module.module_identifier + "</strong><br>" +
                    'String ' + module.string_number + " | Pos " + module.position_in_string + "<br>" +
                    'Statut: ' + module.module_status
                )
                
                rect.on('click', () => openStatusModal(module))
                rect.addTo(drawnItems)
            })
        }
        
        // ================================================================
        // MODAL ANNOTATION
        // ================================================================
        function openStatusModal(module) {
            selectedModule = module
            document.getElementById('modalTitle').textContent = module.module_identifier
            document.getElementById('statusComment').value = module.status_comment || ''
            document.getElementById('statusModal').classList.remove('hidden')
        }
        
        function closeModal() {
            document.getElementById('statusModal').classList.add('hidden')
            selectedModule = null
        }
        
        function selectStatus(status) {
            if (!selectedModule) return
            
            selectedModule.module_status = status
            selectedModule.status_comment = document.getElementById('statusComment').value || null
            
            closeModal()
            renderModules()
            updateStats()
        }
        
        // ================================================================
        // SAUVEGARDE
        // ================================================================
        async function saveAll() {
            try {
                // PHASE 3 : VALIDATION COHERENCE avant sauvegarde
                if (stringsConfig.length > 0) {
                    const totalConfigured = stringsConfig.reduce((sum, s) => sum + s.modulesCount, 0)
                    
                    if (modules.length !== totalConfigured) {
                        const warningMsg = String.fromCharCode(0x26A0) + " INCOHERENCE DETECTEE" + String.fromCharCode(10,10) + 
                            "Configures: " + totalConfigured + " modules" + String.fromCharCode(10) + 
                            "Places: " + modules.length + " modules" + String.fromCharCode(10,10) + 
                            "Sauvegarder quand meme? (NON recommande)"
                        
                        const proceed = confirm(warningMsg)
                        if (!proceed) {
                            alert("Sauvegarde annulee. Ajustez vos modules ou config strings.")
                            return
                        }
                    }
                }
                
                // Sauvegarder modules
                const apiUrl = "/api/pv/plants/" + plantId + "/zones/" + zoneId + "/modules"
                await fetch(apiUrl, {
                    method: "DELETE"
                })
                
                if (modules.length > 0) {
                    const response = await fetch(apiUrl, {
                        method: "POST",
                        headers: { 'Content-Type': "application/json" },
                        body: JSON.stringify({ modules })
                    })
                    
                    const data = await response.json()
                    
                    if (!data.success) {
                        throw new Error(data.error || data.details || "Erreur inconnue")
                    }
                }
                
                // Sauvegarder config
                await saveElectricalConfig()
                
                // Sauvegarder toiture
                if (roofPolygon) await saveRoofPolygon()
                
                const saveMsg = 'OK: Sauvegarde complete reussie!' + String.fromCharCode(10) + modules.length + " modules | Surface: " + roofArea.toFixed(2) + " m2"
                alert(saveMsg)
                
                await loadModules()
            } catch (error) {
                alert("ERREUR: Sauvegarde - " + error.message)
            }
        }
        
        // ================================================================
        // EXPORT PDF
        // ================================================================
        async function exportPDF() {
            const { jsPDF } = window.jspdf
            const doc = new jsPDF('portrait', 'mm', 'a4')
            
            // Calculs statistiques
            const total = modules.length
            const ok = modules.filter(m => m.module_status === "ok").length
            const inequality = modules.filter(m => m.module_status === "inequality").length
            const microcracks = modules.filter(m => m.module_status === "microcracks").length
            const dead = modules.filter(m => m.module_status === "dead").length
            const stringOpen = modules.filter(m => m.module_status === "string_open").length
            const notConnected = modules.filter(m => m.module_status === "not_connected").length
            const pending = modules.filter(m => m.module_status === "pending").length
            const defects = total - ok - pending
            
            const stringCount = parseInt(document.getElementById('stringCount').value) || 0
            const inverterCount = parseInt(document.getElementById('inverterCount').value) || 0
            const junctionBoxCount = parseInt(document.getElementById('junctionBoxCount').value) || 0
            
            const powerKwc = (total * 0.45).toFixed(2)
            const lossKwh = (dead * 300 + stringOpen * 200 + microcracks * 50 + inequality * 25).toFixed(0)
            const lossEur = (lossKwh * 0.18).toFixed(0)
            
            // ========================================
            // PAGE 1: PAGE DE GARDE
            // ========================================
            doc.setFillColor(147, 51, 234)
            doc.rect(0, 0, 210, 60, 'F')
            
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(24)
            doc.setFont('helvetica', 'bold')
            doc.text('DIAGPV', 105, 25, { align: "center" })
            
            doc.setFontSize(18)
            doc.text( "RAPPORT D" + String.fromCharCode(39) + "AUDIT PHOTOVOLTAÏQUE", 105, 40, { align: "center" })
            
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('INFORMATIONS CENTRALE', 20, 80)
            
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')
            doc.text('Client:', 20, 90)
            doc.text(plantData.client_name || 'Non renseigné', 60, 90)
            
            doc.text('Centrale:', 20, 98)
            doc.text(plantData.plant_name || 'Centrale PV', 60, 98)
            
            doc.text('Zone:', 20, 106)
            doc.text(zoneData.zone_name || 'Zone 1', 60, 106)
            
            doc.text('Puissance:', 20, 114)
            doc.text(powerKwc + " kWc", 60, 114)
            
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('INFORMATIONS AUDIT', 20, 130)
            
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')
            doc.text('Date audit:', 20, 140)
            doc.text(new Date().toLocaleDateString('fr-FR'), 60, 140)
            
            doc.text('Auditeur:', 20, 148)
            doc.text('DiagPV - Audit Professionnel', 60, 148)
            
            doc.text('Référence:', 20, 156)
            doc.text( "DIAGPV-2025-" + Date.now().toString().slice(-6), 60, 156)
            
            doc.setFillColor(220, 38, 38)
            doc.roundedRect(20, 170, 170, 15, 3, 3, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('CONFIDENTIEL - USAGE INTERNE UNIQUEMENT', 105, 179, { align: "center" })
            
            doc.setTextColor(150, 150, 150)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.text('DiagPV - Expert Audit Photovoltaïque', 105, 280, { align: "center" })
            doc.text('www.diagnostic-photovoltaique.fr', 105, 285, { align: "center" })
            
            // ========================================
            // PAGE 2: SYNTHÈSE EXÉCUTIVE
            // ========================================
            doc.addPage()
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text('SYNTHÈSE EXÉCUTIVE', 20, 20)
            
            doc.setLineWidth(0.5)
            doc.line(20, 23, 190, 23)
            
            // KPIs principaux
            doc.setFontSize(12)
            doc.text('ÉTAT GÉNÉRAL DE LA CENTRALE', 20, 35)
            
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')
            
            const okPercent = ((ok / total) * 100).toFixed(1)
            const defectsPercent = ((defects / total) * 100).toFixed(1)
            
            doc.text('Modules OK:', 25, 45)
            doc.setFont('helvetica', 'bold')
            doc.text(ok + "/" + total + "  (" + okPercent + String.fromCharCode(37) + ")", 80, 45)
            
            doc.setFont('helvetica', 'normal')
            doc.text('Modules défectueux:', 25, 53)
            doc.setFont('helvetica', 'bold')
            doc.text(defects + "/" + total + "  (" + defectsPercent + String.fromCharCode(37) + ")", 80, 53)
            
            // Répartition défauts
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('RÉPARTITION DES DÉFAUTS', 20, 70)
            
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            
            if (dead > 0) {
                doc.setFillColor(239, 68, 68)
                doc.circle(25, 79, 2, 'F')
                doc.text('Modules HS:', 30, 80)
                doc.setFont('helvetica', 'bold')
                doc.text(dead + "  (" + ((dead/total)*100).toFixed(1) + String.fromCharCode(37) + ")  CRITIQUE", 70, 80)
            }
            
            if (stringOpen > 0) {
                doc.setFillColor(59, 130, 246)
                doc.circle(25, 87, 2, 'F')
                doc.setFont('helvetica', 'normal')
                doc.text('String ouvert:', 30, 88)
                doc.setFont('helvetica', 'bold')
                doc.text(stringOpen + "  (" + ((stringOpen/total)*100).toFixed(1) + String.fromCharCode(37) + ")  MAJEUR", 70, 88)
            }
            
            if (microcracks > 0) {
                doc.setFillColor(249, 115, 22)
                doc.circle(25, 95, 2, 'F')
                doc.setFont('helvetica', 'normal')
                doc.text('Microfissures:', 30, 96)
                doc.setFont('helvetica', 'bold')
                doc.text(microcracks + "  (" + ((microcracks/total)*100).toFixed(1) + String.fromCharCode(37) + ")  MINEUR", 70, 96)
            }
            
            if (inequality > 0) {
                doc.setFillColor(234, 179, 8)
                doc.circle(25, 103, 2, 'F')
                doc.setFont('helvetica', 'normal')
                doc.text('Inégalités:', 30, 104)
                doc.setFont('helvetica', 'bold')
                doc.text(inequality + "  (" + ((inequality/total)*100).toFixed(1) + String.fromCharCode(37) + ")  SURVEILLANCE", 70, 104)
            }
            
            // Impact financier
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('IMPACT ESTIMÉ', 20, 120)
            
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text('Perte production:', 25, 130)
            doc.setFont('helvetica', 'bold')
            doc.text(lossKwh + " kWh/an", 80, 130)
            
            doc.setFont('helvetica', 'normal')
            doc.text('Perte financière:', 25, 138)
            doc.setFont('helvetica', 'bold')
            doc.text(lossEur + " EUR/an (0.18 EUR/kWh)", 80, 138)
            
            // État strings
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('ÉTAT DES STRINGS', 20, 155)
            
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            
            let yString = 165
            const stringNumbers = [...new Set(modules.map(m => m.string_number))].sort((a, b) => a - b)
            
            stringNumbers.forEach(stringNum => {
                const stringModules = modules.filter(m => m.string_number === stringNum)
                const stringOk = stringModules.filter(m => m.module_status === "ok").length
                const stringTotal = stringModules.length
                const stringDefects = stringModules.filter(m => m.module_status !== "ok" && m.module_status !== "pending")
                
                doc.text( "String " + stringNum + ":", 25, yString)
                doc.text(stringOk + "/" + stringTotal + " OK", 50, yString)
                
                if (stringDefects.length > 0) {
                    const defectList = stringDefects.map(m => m.module_identifier).slice(0, 3).join(', ')
                    doc.setFont('helvetica', 'bold')
                    doc.text(stringDefects.length + " défaut" + (stringDefects.length > 1 ? 's' : ''), 80, yString)
                    doc.setFont('helvetica', 'normal')
                    doc.text( "(" + defectList + (stringDefects.length > 3 ? '...' : '') + ")", 105, yString)
                }
                
                yString += 6
            })
            
            // ========================================
            // CONFIGURATION ÉLECTRIQUE (si strings config existe)
            // ========================================
            if (stringsConfig.length > 0) {
                yString += 10 // Espacement avant section
                
                doc.setFontSize(12)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(0, 0, 0)
                doc.text('CONFIGURATION ÉLECTRIQUE', 20, yString)
                
                yString += 8
                
                // En-têtes du tableau
                doc.setFontSize(9)
                doc.setFont('helvetica', 'bold')
                doc.setFillColor(147, 51, 234) // Violet DiagPV
                doc.rect(20, yString - 4, 170, 8, 'F')
                doc.setTextColor(255, 255, 255)
                doc.text('String', 30, yString)
                doc.text('Modules', 80, yString)
                doc.text('Puissance', 130, yString)
                
                yString += 8
                
                // Lignes du tableau
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(0, 0, 0)
                
                let totalModulesConfig = 0
                stringsConfig.forEach((config, index) => {
                    const bgColor = index % 2 === 0 ? [245, 245, 245] : [255, 255, 255]
                    doc.setFillColor(...bgColor)
                    doc.rect(20, yString - 4, 170, 6, 'F')
                    
                    doc.text( "String " + config.stringNum, 30, yString)
                    doc.text(config.modulesCount + " modules", 80, yString)
                    doc.text((config.modulesCount * 0.45).toFixed(2) + " kWc", 130, yString)
                    
                    totalModulesConfig += config.modulesCount
                    yString += 6
                })
                
                // Total
                doc.setFont('helvetica', 'bold')
                doc.setFillColor(147, 51, 234)
                doc.rect(20, yString - 4, 170, 8, 'F')
                doc.setTextColor(255, 255, 255)
                doc.text('TOTAL', 30, yString)
                doc.text(totalModulesConfig + " modules", 80, yString)
                doc.text((totalModulesConfig * 0.45).toFixed(2) + " kWc", 130, yString)
                
                yString += 10 // Espacement après section
            }
            
            // Priorité intervention
            doc.setTextColor(0, 0, 0)
            doc.setFillColor(220, 38, 38)
            doc.roundedRect(20, yString + 5, 170, 25, 3, 3, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.text( "PRIORITÉ INTERVENTION: " + (dead > 0 ? 'P1 - URGENT' : defects > 0 ? 'P2 - COURT TERME' : "P3 - SURVEILLANCE"), 105, yString + 13, { align: "center" })
            
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            if (dead > 0) {
                doc.text( " Remplacer " + dead + " module" + (dead > 1 ? 's' : '') + " HS immédiatement", 105, yString + 20, { align: "center" })
            } else if (stringOpen > 0) {
                doc.text( " Vérifier connexions électriques (" + stringOpen + " string" + (stringOpen > 1 ? 's' : '') + " ouvert" + (stringOpen > 1 ? 's' : '') + ")", 105, yString + 20, { align: "center" })
            } else if (defects > 0) {
                doc.text(' Surveillance et maintenance préventive', 105, yString + 20, { align: "center" })
            }
            
            // ========================================
            // PAGES 4+: DÉFAUTS PAR STRING
            // ========================================
            stringNumbers.forEach(stringNum => {
                const stringModules = modules.filter(m => m.string_number === stringNum)
                const stringDefects = stringModules.filter(m => m.module_status !== "ok" && m.module_status !== "pending")
                
                if (stringDefects.length > 0) {
                    doc.addPage()
                    doc.setTextColor(0, 0, 0)
                    doc.setFontSize(14)
                    doc.setFont('helvetica', 'bold')
                    doc.text( "STRING " + stringNum + " - " + stringModules.length + " MODULES", 20, 20)
                    
                    doc.setLineWidth(0.5)
                    doc.line(20, 23, 190, 23)
                    
                    doc.setFontSize(11)
                    doc.text( "État: " + (stringModules.length - stringDefects.length) + "/" + stringModules.length + " OK (" + (((stringModules.length - stringDefects.length) / stringModules.length) * 100).toFixed(1) + String.fromCharCode(37) + ")", 20, 32)
                    doc.text( "Défauts: " + stringDefects.length, 20, 40)
                    
                    let yDefect = 50
                    stringDefects.forEach(defect => {
                        if (yDefect > 270) {
                            doc.addPage()
                            yDefect = 20
                        }
                        
                        const statusLabels = {
                            dead: "MODULE HS (CRITIQUE)",
                            string_open: "STRING OUVERT (MAJEUR)",
                            microcracks: "MICROFISSURES (MINEUR)",
                            inequality: "INÉGALITÉ (SURVEILLANCE)",
                            not_connected: "NON CONNECTÉ"
                        }
                        
                        const statusColors = {
                            dead: [239, 68, 68],
                            string_open: [59, 130, 246],
                            microcracks: [249, 115, 22],
                            inequality: [234, 179, 8],
                            not_connected: [107, 114, 128]
                        }
                        
                        doc.setFillColor(statusColors[defect.module_status][0], statusColors[defect.module_status][1], statusColors[defect.module_status][2])
                        doc.circle(22, yDefect, 2, 'F')
                        
                        doc.setFontSize(10)
                        doc.setFont('helvetica', 'bold')
                        doc.text(defect.module_identifier + " - " + statusLabels[defect.module_status], 27, yDefect + 1)
                        
                        doc.setFontSize(9)
                        doc.setFont('helvetica', 'normal')
                        yDefect += 7
                        doc.text( "Position: String " + defect.string_number + ", Position " + defect.position_in_string, 27, yDefect)
                        yDefect += 5
                        doc.text( "GPS: " + defect.latitude.toFixed(7) + "°N, " + defect.longitude.toFixed(7) + "°E", 27, yDefect)
                        
                        if (defect.status_comment) {
                            yDefect += 5
                            doc.text( "Commentaire: " + defect.status_comment, 27, yDefect)
                        }
                        
                        yDefect += 10
                    })
                }
            })
            
            // ========================================
            // DERNIÈRE PAGE: LISTE COMPLÈTE
            // ========================================
            doc.addPage()
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('ANNEXE - LISTE COMPLÈTE MODULES', 20, 20)
            
            doc.setLineWidth(0.5)
            doc.line(20, 23, 190, 23)
            
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            let yList = 30
            
            modules.forEach(m => {
                if (yList > 280) {
                    doc.addPage()
                    yList = 20
                }
                
                const statusEmoji = {ok:'OK',inequality:'INEG',microcracks:'MICRO',dead:'HS',string_open:'OPEN',not_connected:'NC',pending:'PEND'}[m.module_status]
                doc.text(m.module_identifier + " | S" + m.string_number + "P" + m.position_in_string + " | " + statusEmoji, 20, yList)
                yList += 5
            })
            
            // ========================================
            // PAGE FINALE: PLAN CARTOGRAPHIQUE
            // ========================================
            doc.addPage()
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text('PLAN CARTOGRAPHIQUE DE LA CENTRALE', 20, 20)
            
            doc.setLineWidth(0.5)
            doc.line(20, 23, 190, 23)
            
            // Capture carte avec html2canvas
            const mapElement = document.getElementById('map')
            
            try {
                const canvas = await html2canvas(mapElement, {
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: "#ffffff",
                    scale: 2 // Haute qualité
                })
                
                const imgData = canvas.toDataURL('image/jpeg', 0.9)
                
                // Ajouter image carte (format paysage dans portrait)
                const imgWidth = 170
                const imgHeight = (canvas.height * imgWidth) / canvas.width
                const maxHeight = 240
                
                const finalHeight = Math.min(imgHeight, maxHeight)
                const finalWidth = (canvas.width * finalHeight) / canvas.height
                
                doc.addImage(imgData, 'JPEG', 20, 35, finalWidth, finalHeight)
                
                // Légende couleurs
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.text('LÉGENDE STATUTS MODULES:', 20, finalHeight + 50)
                
                doc.setFont('helvetica', 'normal')
                let yLegend = finalHeight + 60
                
                doc.setFillColor(34, 197, 94)  // Vert
                doc.rect(20, yLegend - 3, 5, 5, 'F')
                doc.text('OK: Aucun défaut', 30, yLegend)
                
                doc.setFillColor(234, 179, 8)  // Jaune
                doc.rect(80, yLegend - 3, 5, 5, 'F')
                doc.text('Inégalité', 90, yLegend)
                
                yLegend += 8
                doc.setFillColor(249, 115, 22)  // Orange
                doc.rect(20, yLegend - 3, 5, 5, 'F')
                doc.text('Microfissures', 30, yLegend)
                
                doc.setFillColor(239, 68, 68)  // Rouge
                doc.rect(80, yLegend - 3, 5, 5, 'F')
                doc.text('Module HS', 90, yLegend)
                
                yLegend += 8
                doc.setFillColor(59, 130, 246)  // Bleu
                doc.rect(20, yLegend - 3, 5, 5, 'F')
                doc.text('String ouvert', 30, yLegend)
                
                doc.setFillColor(107, 114, 128)  // Gris
                doc.rect(80, yLegend - 3, 5, 5, 'F')
                doc.text('Non connecté', 90, yLegend)
                
                console.log("✅ Plan cartographique ajouté au PDF")
            } catch (error) {
                console.error('❌ Erreur capture carte:', error)
                doc.setFontSize(12)
                doc.setFont('helvetica', 'italic')
                doc.setTextColor(200, 0, 0)
                doc.text('Erreur lors de la capture du plan cartographique', 20, 40)
            }
            
            // Footer sur toutes pages
            const pageCount = doc.internal.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setTextColor(128, 128, 128)
                doc.text( "DiagPV - Rapport Audit PV - " + (plantData.plant_name || 'Centrale'), 20, 287)
                doc.text( "Page " + i + "/" + pageCount, 180, 287)
                doc.text( "Confidentiel - " + new Date().toLocaleDateString('fr-FR'), 105, 287, { align: "center" })
            }
            
            doc.save( "DiagPV_" + (zoneData.zone_name || 'Zone') + "_" + Date.now() + ".pdf")
        }
        
        // ================================================================
        // STATS
        // ================================================================
        function updateStats() {
            const total = modules.length
            const ok = modules.filter(m => m.module_status === "ok").length
            const inequality = modules.filter(m => m.module_status === "inequality").length
            const microcracks = modules.filter(m => m.module_status === "microcracks").length
            const dead = modules.filter(m => m.module_status === "dead").length
            const stringOpen = modules.filter(m => m.module_status === "string_open").length
            const notConnected = modules.filter(m => m.module_status === "not_connected").length
            const pending = modules.filter(m => m.module_status === "pending").length
            
            document.getElementById('statsTotal').textContent = total
            document.getElementById('statsTotal2').textContent = total
            document.getElementById('statsOk').textContent = ok
            document.getElementById('statsOk2').textContent = ok
            document.getElementById('statsInequality').textContent = inequality
            document.getElementById('statsMicrocracks').textContent = microcracks
            document.getElementById('statsDead').textContent = dead
            document.getElementById('statsDead2').textContent = dead
            document.getElementById('statsStringOpen').textContent = stringOpen
            document.getElementById('statsNotConnected').textContent = notConnected
            document.getElementById('statsPending').textContent = pending
            document.getElementById('statsPending2').textContent = pending
        }
        
        // ================================================================
        // AUTO-CONFIGURATION DEPUIS MODULES (SYNC BIDIRECTIONNELLE)
        // ================================================================
        function autoConfigureFromModules() {
            if (modules.length === 0) return
            
            // Détecter nombre de strings uniques
            const stringNumbers = [...new Set(modules.map(m => m.string_number))].sort((a, b) => a - b)
            
            // Compter modules par string
            const stringsDetected = stringNumbers.map(stringNum => {
                const modulesInString = modules.filter(m => m.string_number === stringNum).length
                return { stringNum, modulesCount: modulesInString }
            })
            
            // Mettre à jour stringsConfig
            stringsConfig = stringsDetected
            
            // Mettre à jour les champs du formulaire (avec vérification DOM)
            const stringCountEl = document.getElementById('stringCount')
            const modulesPerStringEl = document.getElementById('modulesPerString')
            const inverterCountEl = document.getElementById('inverterCount')
            const junctionBoxCountEl = document.getElementById('junctionBoxCount')
            
            if (!stringCountEl || !modulesPerStringEl || !inverterCountEl || !junctionBoxCountEl) {
                console.warn('ATTENTION Formulaire pas encore chargé - skip MAJ DOM')
                return
            }
            
            stringCountEl.value = stringNumbers.length
            const avgModulesPerString = Math.round(modules.length / stringNumbers.length)
            modulesPerStringEl.value = avgModulesPerString
            
            // Estimation onduleurs et BJ
            const estimatedInverters = Math.ceil(modules.length / 30) // ~30 modules par onduleur
            const estimatedJunctionBoxes = stringNumbers.length // 1 BJ par string
            inverterCountEl.value = estimatedInverters
            junctionBoxCountEl.value = estimatedJunctionBoxes
            
            console.log(" AUTO-CONFIG depuis modules:", {
                strings: stringNumbers.length,
                modulesPerString: avgModulesPerString,
                totalModules: modules.length,
                inverters: estimatedInverters,
                junctionBoxes: estimatedJunctionBoxes,
                stringsConfig: stringsConfig
            })
        }
        
        // ================================================================
        // REDISTRIBUTION STRINGS
        // ================================================================
        function redistributeStrings() {
            if (modules.length === 0) {
                alert("ATTENTION Aucun module à redistribuer!")
                return
            }
            
            const totalModules = modules.length
            
            // Calculer distribution optimale (20-30 modules/string)
            const targetModulesPerString = 25
            const calculatedStrings = Math.ceil(totalModules / targetModulesPerString)
            
            const msg = " REDISTRIBUTION AUTOMATIQUE" + String.fromCharCode(10,10) +
                "Total modules: " + totalModules + String.fromCharCode(10) +
                "Strings détectés: " + calculatedStrings + String.fromCharCode(10) +
                "Modules/string: ~" + Math.round(totalModules / calculatedStrings) + String.fromCharCode(10,10) +
                "Confirmer redistribution?"
            
            if (!confirm(msg)) return
            
            // Créer nouvelle distribution uniforme
            const baseModulesPerString = Math.floor(totalModules / calculatedStrings)
            const remainder = totalModules % calculatedStrings
            
            let currentStringNum = 1
            let positionInString = 1
            
            modules.forEach((module, index) => {
                // Calculer limite du string actuel
                const limitForThisString = baseModulesPerString + (currentStringNum <= remainder ? 1 : 0)
                
                // Assigner string et position
                module.string_number = currentStringNum
                module.position_in_string = positionInString
                
                positionInString++
                
                // Passer au string suivant si limite atteinte
                if (positionInString > limitForThisString) {
                    currentStringNum++
                    positionInString = 1
                }
            })
            
            // Mettre à jour stringsConfig
            stringsConfig = []
            for (let i = 1; i <= calculatedStrings; i++) {
                const modulesForThisString = baseModulesPerString + (i <= remainder ? 1 : 0)
                stringsConfig.push({ stringNum: i, modulesCount: modulesForThisString })
            }
            
            // Mettre à jour formulaire (avec vérification DOM)
            const stringCountEl = document.getElementById('stringCount')
            const modulesPerStringEl = document.getElementById('modulesPerString')
            const inverterCountEl = document.getElementById('inverterCount')
            const junctionBoxCountEl = document.getElementById('junctionBoxCount')
            
            if (stringCountEl) stringCountEl.value = calculatedStrings
            if (modulesPerStringEl) modulesPerStringEl.value = baseModulesPerString
            if (inverterCountEl) inverterCountEl.value = Math.ceil(totalModules / 30)
            if (junctionBoxCountEl) junctionBoxCountEl.value = calculatedStrings
            
            // Rafraîchir affichage
            renderModules()
            updateStringsProgress()
            
            console.log("✅ Redistribution terminée:", stringsConfig)
            alert("✅ Redistribution réussie!" + String.fromCharCode(10,10) + calculatedStrings + " strings créés" + String.fromCharCode(10) + "N" + String.fromCharCode(39) + "oubliez pas de SAUVEGARDER!")
        }
        
        // ================================================================
        // PROGRESSION STRINGS (VISUAL FEEDBACK)
        // ================================================================
        function updateStringsProgress() {
            const panel = document.getElementById('stringsProgressPanel')
            const container = document.getElementById('stringsProgressContainer')
            
            // Masquer si pas de config
            if (stringsConfig.length === 0) {
                panel.classList.add('hidden')
                return
            }
            
            // Afficher panneau
            panel.classList.remove('hidden')
            
            // Calculer progression par string
            const stringProgress = stringsConfig.map(config => {
                const stringModules = modules.filter(m => m.string_number === config.stringNum)
                const placed = stringModules.length
                const total = config.modulesCount
                const percentage = total > 0 ? (placed / total * 100) : 0
                
                let status = ''
                let statusColor = ''
                if (placed === total) {
                    status = String.fromCharCode(0x2705) + ' COMPLET'  // ✅
                    statusColor = 'text-green-400'
                } else if (placed > total) {
                    status = String.fromCharCode(0x26A0) + ' DEPASSEMENT'  // ⚠
                    statusColor = 'text-red-400'
                } else if (placed > 0) {
                    status = String.fromCharCode(0x23F3) + ' EN COURS'  // ⏳
                    statusColor = 'text-yellow-400'
                } else {
                    status = String.fromCharCode(0x274C) + ' VIDE'  // ❌
                    statusColor = 'text-gray-400'
                }
                
                return { stringNum: config.stringNum, placed, total, percentage, status, statusColor }
            })
            
            // Générer HTML
            container.innerHTML = stringProgress.map(p => 
                '<div class="bg-black rounded p-2 text-xs">' +
                    '<div class="flex justify-between items-center mb-1">' +
                        '<span class="font-bold text-white">String ' + p.stringNum + '</span>' +
                        '<span class="' + p.statusColor + ' font-bold">' + p.status + '</span>' +
                    '</div>' +
                    '<div class="flex justify-between items-center mb-1">' +
                        '<span class="text-gray-400">' + p.placed + '/' + p.total + ' modules</span>' +
                        '<span class="text-gray-400">' + p.percentage.toFixed(0) + String.fromCharCode(37) + '</span>' +
                    '</div>' +
                    '<div class="w-full bg-gray-700 rounded-full h-2">' +
                        '<div class="bg-yellow-400 h-2 rounded-full transition-all" style="width: ' + Math.min(p.percentage, 100) + String.fromCharCode(37) + '"></div>' +
                    '</div>' +
                '</div>'
            ).join('')
            
            // Total global
            const totalConfigured = stringsConfig.reduce((sum, s) => sum + s.modulesCount, 0)
            const totalPlaced = modules.length
            const globalPercentage = totalConfigured > 0 ? (totalPlaced / totalConfigured * 100) : 0
            
            container.innerHTML += 
                '<div class="bg-yellow-900/30 border border-yellow-400 rounded p-2 text-xs mt-2">' +
                    '<div class="flex justify-between items-center mb-1">' +
                        '<span class="font-black text-yellow-400">TOTAL GLOBAL</span>' +
                        '<span class="font-black text-yellow-400">' + totalPlaced + '/' + totalConfigured + '</span>' +
                    '</div>' +
                    '<div class="w-full bg-gray-700 rounded-full h-3">' +
                        '<div class="bg-yellow-400 h-3 rounded-full transition-all font-bold text-center text-black text-xs leading-3" style="width: ' + Math.min(globalPercentage, 100) + String.fromCharCode(37) + '">' +
                            (globalPercentage > 20 ? globalPercentage.toFixed(0) + String.fromCharCode(37) : '') +
                        '</div>' +
                    '</div>' +
                '</div>'
        }
        
        // ================================================================
        // EVENT LISTENERS
        // ================================================================
        function setupEventListeners() {
            // STRUCTURES (Désactivé - fait doublon avec toiture)
            // document.getElementById('drawBuildingBtn').addEventListener('click', () => startDrawingStructure('building'))
            // document.getElementById('drawCarportBtn').addEventListener('click', () => startDrawingStructure('carport'))
            // document.getElementById('drawGroundBtn').addEventListener('click', () => startDrawingStructure('ground'))
            // document.getElementById('drawTechnicalBtn').addEventListener('click', () => startDrawingStructure('technical'))
            
            document.getElementById('drawRoofBtn').addEventListener('click', enableRoofDrawing)
            document.getElementById('clearRoofBtn').addEventListener('click', clearRoof)
            document.getElementById('saveConfigBtn').addEventListener('click', saveElectricalConfig)
            
            // Strings Configuration (Non-Regular)
            document.getElementById('configureStringsBtn').addEventListener('click', openStringsConfigModal)
            document.getElementById('applyStringsConfigBtn').addEventListener('click', applyStringsConfig)
            document.getElementById('cancelStringsConfigBtn').addEventListener('click', closeStringsModal)
            document.getElementById('editStringsConfigBtn').addEventListener('click', editStringsConfig)
            
            // Module Placement
            document.getElementById('drawRowBtn').addEventListener('click', drawRowMode)
            document.getElementById('placeManualBtn').addEventListener('click', placeModuleManual)
            // document.getElementById('placeAutoBtn').addEventListener('click', placeModulesAuto) // Function not defined
            document.getElementById('rotateBtn').addEventListener('click', () => {
                currentRotation = (currentRotation + 90) % 360
                document.getElementById('rotationLabel').textContent = currentRotation + "°"
            })
            document.getElementById('validateCalepinageBtn').addEventListener('click', cleanInvalidModules)
            document.getElementById('clearModulesBtn').addEventListener('click', clearModules)
            document.getElementById('redistributeStringsBtn').addEventListener('click', redistributeStrings)
            document.getElementById('saveAllBtn').addEventListener('click', saveAll)
            document.getElementById('exportBtn').addEventListener('click', exportPDF)
            
            // Rectangle Modules (SolarEdge style)
            document.getElementById('createRectangleBtn').addEventListener('click', createModuleRectangle)
            document.getElementById('importFromELBtn').addEventListener('click', openImportELModal)
            document.getElementById('cancelImportELBtn').addEventListener('click', () => {
                document.getElementById('importELModal').classList.add('hidden')
            })
            document.getElementById('rectRows').addEventListener('input', updateRectTotal)
            document.getElementById('rectCols').addEventListener('input', updateRectTotal)
            document.getElementById('showModules').addEventListener('change', toggleModulesVisibility)
            document.getElementById('showRectGrid').addEventListener('change', toggleRectGridVisibility)
            document.getElementById('showRectLabels').addEventListener('change', toggleRectLabelsVisibility)
            document.getElementById('hideAlignmentHelp').addEventListener('click', () => {
                document.getElementById('alignmentHelp').classList.add('hidden')
            })
            document.getElementById('showRectInfo').addEventListener('change', toggleRectInfoVisibility)
            document.getElementById('togglePersistentEditBtn').addEventListener('click', togglePersistentEditMode)
            document.getElementById('liveRotationPreview').addEventListener('change', (e) => {
                liveRotationPreview = e.target.checked
                console.log(liveRotationPreview ? "✅ Aperçu rotation temps réel activé" : "❌ Aperçu rotation temps réel désactivé")
            })
            
            // Configuration électrique - Onduleurs
            const addInverterBtn = document.getElementById('addInverterBtn')
            const inverterForm = document.getElementById('inverterForm')
            const cancelInverterBtn = document.getElementById('cancelInverterBtn')
            const validateElectricalBtn = document.getElementById('validateElectricalBtn')
            
            if (addInverterBtn) {
                addInverterBtn.addEventListener('click', () => showInverterModal(null))
            }
            if (inverterForm) {
                inverterForm.addEventListener('submit', saveInverter)
            }
            if (cancelInverterBtn) {
                cancelInverterBtn.addEventListener('click', hideInverterModal)
            }
            if (validateElectricalBtn) {
                validateElectricalBtn.addEventListener('click', validateElectricalConfig)
            }
            
            // Export GeoJSON/KML/CSV
            const exportGeoJsonBtn = document.getElementById('exportGeoJsonBtn')
            const exportKmlBtn = document.getElementById('exportKmlBtn')
            const exportCsvBtn = document.getElementById('exportCsvBtn')
            
            if (exportGeoJsonBtn) {
                exportGeoJsonBtn.addEventListener('click', exportGeoJSON)
            }
            if (exportKmlBtn) {
                exportKmlBtn.addEventListener('click', exportKML)
            }
            if (exportCsvBtn) {
                exportCsvBtn.addEventListener('click', exportCSV)
            }
            
            document.querySelectorAll('.status-btn').forEach(btn => {
                btn.addEventListener('click', () => selectStatus(btn.dataset.status))
            })
            document.getElementById('cancelStatusBtn').addEventListener('click', closeModal)
            
            // Navigation Module EL - Interconnexion Canvas V2  Module EL
            document.getElementById('elAuditBtn').addEventListener('click', () => {
                window.location.href = '/api/el/audit/zone/' + zoneId
            })
            
            // Import Audit EL
            document.getElementById('importElAuditBtn').addEventListener('click', importElAudit)
            
            // Gestion liaison EL
            const viewElBtn = document.getElementById('viewElAuditBtn')
            const resyncBtn = document.getElementById('resyncElBtn')
            const unlinkBtn = document.getElementById('unlinkElBtn')
            
            if (viewElBtn) viewElBtn.addEventListener('click', viewElAudit)
            if (resyncBtn) resyncBtn.addEventListener('click', resyncEl)
            if (unlinkBtn) unlinkBtn.addEventListener('click', unlinkEl)
        }
        
        // ================================================================
        // IMPORT AUDIT EL DANS ZONE PV
        // ================================================================
        async function importElAudit() {
            const token = prompt("Token Audit EL:" + String.fromCharCode(10) + "Entrez le token de l" + String.fromCharCode(39) + "audit EL à importer")
            
            if (!token || token.trim() === '') {
                return
            }
            
            if (!confirm("Importer audit EL ?" + String.fromCharCode(10) + String.fromCharCode(10) + "Token: " + token + String.fromCharCode(10) + String.fromCharCode(10) + "Cette action va:" + String.fromCharCode(10) + "1. Lier cet audit EL à la zone PV" + String.fromCharCode(10) + "2. Synchroniser les statuts modules" + String.fromCharCode(10) + String.fromCharCode(10) + "Continuer ?")) {
                return
            }
            
            try {
                // Étape 1: Créer liaison
                const linkResponse = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/link-el-audit\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ el_audit_token: token.trim() })
                })
                
                const linkData = await linkResponse.json()
                
                if (!linkResponse.ok) {
                    alert("ERREUR Liaison:" + String.fromCharCode(10) + linkData.error)
                    return
                }
                
                alert("✅ Liaison créée !" + String.fromCharCode(10) + String.fromCharCode(10) + "Audit: " + linkData.audit_project + String.fromCharCode(10) + "Client: " + linkData.audit_client + String.fromCharCode(10) + "Modules: " + linkData.total_modules + String.fromCharCode(10) + String.fromCharCode(10) + "Synchronisation en cours...")
                
                // Étape 2: Synchroniser statuts
                const syncResponse = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/sync-from-el\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
                
                const syncData = await syncResponse.json()
                
                if (!syncResponse.ok) {
                    alert("ATTENTION Synchronisation:" + String.fromCharCode(10) + syncData.error)
                    return
                }
                
                // Recharger modules
                await loadModules()
                renderModules()
                updateStats()
                
                alert("🎉 IMPORT RÉUSSI !" + String.fromCharCode(10) + String.fromCharCode(10) + "Modules synchronisés: " + syncData.stats.synced + "/" + syncData.stats.total_pv_modules + String.fromCharCode(10) + "Modules avec défauts: " + syncData.stats.with_defects + String.fromCharCode(10) + String.fromCharCode(10) + "La carte a été mise à jour avec les statuts EL.")
                
            } catch (error) {
                console.error('Erreur import audit EL:', error)
                alert("ERREUR:" + String.fromCharCode(10) + error.message)
            }
            
            // Refresh liaison après import
            await checkElLink()
        }
        
        // ================================================================
        // GESTION LIAISON AUDIT EL
        // ================================================================
        let currentElLink = null
        
        async function checkElLink() {
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/el-link\`)
                const data = await response.json()
                
                if (data.linked && data.link) {
                    currentElLink = data.link
                    showElLinkStatus(data.link)
                } else {
                    currentElLink = null
                    hideElLinkStatus()
                }
            } catch (error) {
                console.error('Erreur vérification liaison EL:', error)
            }
        }
        
        function showElLinkStatus(link) {
            const statusDiv = document.getElementById('elLinkStatus')
            const infoDiv = document.getElementById('elLinkInfo')
            const importBtn = document.getElementById('importElAuditBtn')
            
            if (statusDiv && infoDiv) {
                statusDiv.classList.remove('hidden')
                infoDiv.textContent = link.project_name + " (" + link.total_modules + " modules, " + (link.total_modules_synced || 0) + " syncés)"
            }
            
            if (importBtn) {
                importBtn.classList.add('hidden')
            }
        }
        
        function hideElLinkStatus() {
            const statusDiv = document.getElementById('elLinkStatus')
            const importBtn = document.getElementById('importElAuditBtn')
            
            if (statusDiv) {
                statusDiv.classList.add('hidden')
            }
            
            if (importBtn) {
                importBtn.classList.remove('hidden')
            }
        }
        
        async function viewElAudit() {
            if (!currentElLink) {
                alert("Aucune liaison trouvée")
                return
            }
            
            window.location.href = '/audit/' + currentElLink.el_audit_token
        }
        
        async function resyncEl() {
            if (!currentElLink) {
                alert("Aucune liaison trouvée")
                return
            }
            
            if (!confirm("Re-synchroniser les statuts depuis l" + String.fromCharCode(39) + "audit EL ?" + String.fromCharCode(10) + String.fromCharCode(10) + "Audit: " + currentElLink.project_name + String.fromCharCode(10) + String.fromCharCode(10) + "Les statuts modules seront mis à jour.")) {
                return
            }
            
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/sync-from-el\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
                
                const data = await response.json()
                
                if (!response.ok) {
                    alert("ERREUR:" + String.fromCharCode(10) + data.error)
                    return
                }
                
                // Recharger modules
                await loadModules()
                renderModules()
                updateStats()
                await checkElLink()
                
                alert("✅ Re-synchronisation réussie !" + String.fromCharCode(10) + String.fromCharCode(10) + "Modules synchronisés: " + data.stats.synced + "/" + data.stats.total_pv_modules + String.fromCharCode(10) + "Modules avec défauts: " + data.stats.with_defects)
                
            } catch (error) {
                console.error('Erreur re-sync:', error)
                alert("ERREUR:" + String.fromCharCode(10) + error.message)
            }
        }
        
        async function unlinkEl() {
            if (!currentElLink) {
                alert("Aucune liaison trouvée")
                return
            }
            
            if (!confirm("ATTENTION: Délier l" + String.fromCharCode(39) + "audit EL ?" + String.fromCharCode(10) + String.fromCharCode(10) + "Audit: " + currentElLink.project_name + String.fromCharCode(10) + String.fromCharCode(10) + "Les statuts modules resteront sur la carte." + String.fromCharCode(10) + "Vous pourrez relancer un import plus tard." + String.fromCharCode(10) + String.fromCharCode(10) + "Continuer ?")) {
                return
            }
            
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}/el-link\`, {
                    method: 'DELETE'
                })
                
                const data = await response.json()
                
                if (!response.ok) {
                    alert("ERREUR:" + String.fromCharCode(10) + data.error)
                    return
                }
                
                currentElLink = null
                hideElLinkStatus()
                
                alert("✅ Liaison supprimée !" + String.fromCharCode(10) + String.fromCharCode(10) + "Les statuts modules sont conservés sur la carte." + String.fromCharCode(10) + "Vous pouvez importer un nouvel audit EL.")
                
            } catch (error) {
                console.error('Erreur déliaison:', error)
                alert("ERREUR:" + String.fromCharCode(10) + error.message)
            }
        }
        
        // ================================================================
        // SYNCHRONISATION AUTOMATIQUE MODULE EL  CANVAS V2
        // ================================================================
        // Synchronise les statuts modules depuis l'API EL vers Canvas V2
        async function syncModulesFromEL() {
            const statusEl = document.getElementById('syncStatusText')
            const lastTimeEl = document.getElementById('syncLastTime')
            
            try {
                // Mettre à jour UI
                if (statusEl) statusEl.textContent = ' Synchronisation...'
                if (statusEl) statusEl.className = 'font-bold text-cyan-400'
                
                const response = await fetch(\`/api/el/zone/\${zoneId}/modules\`)
                const data = await response.json()
                
                if (!data.success || !data.modules) {
                    console.warn('ATTENTION Aucune donnée EL disponible')
                    if (statusEl) statusEl.textContent = 'ATTENTION Aucune donnée EL'
                    if (statusEl) statusEl.className = 'font-bold text-yellow-400'
                    return 0
                }
                
                let syncCount = 0
                
                // Mettre à jour module_status dans modules[] basé sur données EL
                data.modules.forEach(elModule => {
                    const localModule = modules.find(m => m.module_identifier === elModule.module_identifier)
                    
                    if (localModule) {
                        // Synchroniser statut et données EL
                        localModule.module_status = elModule.module_status
                        localModule.el_defect_type = elModule.el_defect_type
                        localModule.el_severity_level = elModule.el_severity_level
                        localModule.el_notes = elModule.el_notes
                        localModule.el_photo_url = elModule.el_photo_url
                        syncCount++
                    }
                })
                
                console.log(\`✅ Synchronisation EL: \${syncCount}/\${modules.length} modules mis à jour\`)
                
                // Rafraîchir affichage visuel
                renderModules()  // Re-render avec nouvelles couleurs
                // CRITIQUE: Vérifier que rectangle existe avant appel refreshModuleColors()
                moduleRectangles.forEach(rect => {
                    if (rect.rectangle) {
                        rect.refreshModuleColors()
                    }
                })
                updateStats()
                
                // Mettre à jour UI
                if (statusEl) statusEl.textContent = \`✅ Sync OK (\${syncCount})\`
                if (statusEl) statusEl.className = 'font-bold text-green-400'
                if (lastTimeEl) lastTimeEl.textContent = new Date().toLocaleTimeString('fr-FR')
                
                return syncCount
            } catch (error) {
                console.error('❌ Erreur sync EL:', error)
                if (statusEl) statusEl.textContent = '❌ Erreur sync'
                if (statusEl) statusEl.className = 'font-bold text-red-400'
                return 0
            }
        }
        
        // Auto-sync au chargement de la page (après retour depuis Module EL)
        window.addEventListener('focus', () => {
            console.log(" Page focus - Synchronisation automatique EL...")
            syncModulesFromEL()
        })
        
        // Polling automatique toutes les 30 secondes (si activé)
        let autoSyncInterval = null
        
        function startAutoSync() {
            if (autoSyncInterval) clearInterval(autoSyncInterval)
            
            autoSyncInterval = setInterval(() => {
                const autoSyncCheckbox = document.getElementById('autoSyncEnabled')
                if (autoSyncCheckbox && autoSyncCheckbox.checked) {
                    console.log(" Auto-sync (30s)...")
                    syncModulesFromEL()
                }
            }, 30000)  // 30 secondes
            
            console.log("✅ Auto-sync activé (30s)")
        }
        
        function stopAutoSync() {
            if (autoSyncInterval) {
                clearInterval(autoSyncInterval)
                autoSyncInterval = null
                console.log(" Auto-sync désactivé")
            }
        }
        
        // Démarrer auto-sync au chargement
        startAutoSync()
        
        // Event listener checkbox auto-sync
        const autoSyncCheckbox = document.getElementById('autoSyncEnabled')
        if (autoSyncCheckbox) {
            autoSyncCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    startAutoSync()
                } else {
                    stopAutoSync()
                }
            })
        }
        
        // Event listener bouton sync manuel
        const syncELBtn = document.getElementById('syncELBtn')
        if (syncELBtn) {
            syncELBtn.addEventListener('click', () => {
                console.log(" Sync manuelle déclenchée")
                syncModulesFromEL()
            })
        }
        
        // Exposer fonction sync dans console
        window.syncModulesFromEL = syncModulesFromEL
        window.startAutoSync = startAutoSync
        window.stopAutoSync = stopAutoSync
        
        // Exposer fonctions debug et rectangles dans console
        window.cleanInvalidModules = cleanInvalidModules
        window.deleteRectangle = deleteRectangle
        window.duplicateRectangle = duplicateRectangle
        window.deleteStructure = deleteStructure // NOUVEAU: Structures
        window.debugModules = () => {
            console.log("STATS Modules totaux:", modules.length)
            console.log("❌ Modules invalides:", modules.filter(m => !m.latitude || !m.longitude).length)
            console.log("✅ Modules valides:", modules.filter(m => m.latitude && m.longitude).length)
        }
        window.debugRectangles = () => {
            console.log(" Rectangles:", moduleRectangles.length)
            moduleRectangles.forEach(r => {
                console.log("  Rectangle", r.id, ":", r.rows, "x", r.cols, "=", r.modules.length, "modules")
            })
        }
        
        // INIT
        init()
        <\/script>
    </body>
    </html>
  `)
})

// ============================================================================
// ROUTE PV CARTOGRAPHY - Détail Centrale (PHASE 2a)
// ============================================================================
app.get('/pv/plant/:id', async (c) => {
  const plantId = c.req.param('id')
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Centrale PV - Détail & Zones</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-7xl">
            <!-- Header Navigation -->
            <div class="mb-6 flex justify-between items-center">
                <div class="flex gap-3">
                    <a href="/pv/plants" class="text-purple-400 hover:text-purple-300 font-bold">
                        <i class="fas fa-arrow-left mr-2"></i>RETOUR CENTRALES
                    </a>
                    <a href="/dashboard" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-chart-line mr-1"></i>AUDITS
                    </a>
                </div>
                <a href="/" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-bold">
                    <i class="fas fa-home mr-2"></i>ACCUEIL
                </a>
            </div>

            <!-- Loading -->
            <div id="loading" class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-purple-400 mb-4"></i>
                <p class="text-gray-400">Chargement centrale...</p>
            </div>

            <!-- Erreur -->
            <div id="error" class="hidden bg-red-900 border-2 border-red-400 rounded-lg p-6 text-center">
                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                <p id="errorMessage" class="text-xl"></p>
                <a href="/pv/plants" class="inline-block mt-4 bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-bold">
                    RETOUR LISTE CENTRALES
                </a>
            </div>

            <!-- Contenu Principal -->
            <div id="content" class="hidden">
                <!-- Header Centrale -->
                <div class="bg-gray-900 rounded-lg border-2 border-purple-400 p-6 mb-8">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h1 id="plantName" class="text-3xl font-black text-purple-400 mb-2">...</h1>
                            <p id="plantType" class="text-gray-400">
                                <i class="fas fa-building mr-2"></i>Type: ...
                            </p>
                            <p id="plantAddress" class="text-gray-400 mt-1">
                                <i class="fas fa-map-marker-alt mr-2"></i>...
                            </p>
                        </div>
                        <div class="flex gap-3">
                            <button id="createAuditBtn" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold" title="Créer un audit EL depuis cette centrale PV">
                                <i class="fas fa-plus-circle mr-2"></i>CRÉER AUDIT EL
                            </button>
                            <button id="editPlantBtn" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold">
                                <i class="fas fa-edit mr-2"></i>MODIFIER
                            </button>
                        </div>
                    </div>

                    <!-- Stats Globales -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div class="bg-gray-800 rounded-lg p-4 text-center">
                            <div class="text-3xl font-black text-blue-400" id="statsZones">0</div>
                            <div class="text-sm text-gray-400">Zones</div>
                        </div>
                        <div class="bg-gray-800 rounded-lg p-4 text-center">
                            <div class="text-3xl font-black text-green-400" id="statsModules">0</div>
                            <div class="text-sm text-gray-400">Modules</div>
                        </div>
                        <div class="bg-gray-800 rounded-lg p-4 text-center">
                            <div class="text-3xl font-black text-yellow-400" id="statsPower">0</div>
                            <div class="text-sm text-gray-400">kWc</div>
                        </div>
                        <div class="bg-gray-800 rounded-lg p-4 text-center">
                            <div class="text-3xl font-black text-purple-400" id="statsArea">0</div>
                            <div class="text-sm text-gray-400">m²</div>
                        </div>
                    </div>
                </div>

                <!-- Section Zones -->
                <div class="mb-8">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-black text-purple-400">
                            <i class="fas fa-layer-group mr-2"></i>ZONES
                        </h2>
                        <button id="addZoneBtn" class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-black">
                            <i class="fas fa-plus mr-2"></i>AJOUTER ZONE
                        </button>
                    </div>

                    <!-- Liste Zones (vide) -->
                    <div id="emptyZones" class="hidden text-center py-12 bg-gray-900 rounded-lg border-2 border-gray-700">
                        <i class="fas fa-layer-group text-6xl text-gray-600 mb-4"></i>
                        <p class="text-gray-400 text-xl mb-6">Aucune zone créée</p>
                        <button onclick="showAddZoneModal()" class="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded font-black text-lg">
                            <i class="fas fa-plus mr-2"></i>CRÉER PREMIÈRE ZONE
                        </button>
                    </div>

                    <!-- Liste Zones (remplie) -->
                    <div id="zonesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
                </div>
            </div>
        </div>

        <!-- Modal Ajout/Édition Zone -->
        <div id="zoneModal" class="hidden fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4" style="z-index: 10000;">
            <div class="bg-gray-900 border-2 border-purple-400 rounded-lg p-6 max-w-2xl w-full">
                <h3 class="text-2xl font-black mb-4 text-purple-400">
                    <i class="fas fa-layer-group mr-2"></i><span id="modalTitle">NOUVELLE ZONE</span>
                </h3>
                
                <form id="zoneForm" class="space-y-4">
                    <input type="hidden" id="zoneId">
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Nom de la zone *</label>
                        <input type="text" id="zoneName" required
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                               placeholder="Ex: Toiture Sud, Secteur A">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Type de zone *</label>
                        <select id="zoneType" required
                                class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none">
                            <option value="roof">Toiture</option>
                            <option value="ground">Sol</option>
                            <option value="carport">Ombrière</option>
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold mb-2">Azimut (°) *</label>
                            <input type="number" id="zoneAzimuth" required min="0" max="360" value="180"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none">
                            <p class="text-xs text-gray-500 mt-1">0°=Nord, 90°=Est, 180°=Sud, 270°=Ouest</p>
                        </div>
                        <div>
                            <label class="block text-sm font-bold mb-2">Inclinaison (°) *</label>
                            <input type="number" id="zoneTilt" required min="0" max="90" value="30"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none">
                            <p class="text-xs text-gray-500 mt-1">0°=Plat, 90°=Vertical</p>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Surface estimée (m²)</label>
                        <input type="number" id="zoneArea" min="0" step="0.1"
                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                               placeholder="Ex: 150.5">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold mb-2">Notes</label>
                        <textarea id="zoneNotes" rows="3"
                                  class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                                  placeholder="Remarques techniques..."></textarea>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded font-black">
                            <i class="fas fa-save mr-2"></i>ENREGISTRER
                        </button>
                        <button type="button" id="cancelZoneBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded font-black">
                            ANNULER
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script>
        const plantId = '${plantId}'
        let plantData = null
        let zones = []

        document.addEventListener('DOMContentLoaded', () => {
        
        async function loadPlantDetail() {
            try {
                document.getElementById('loading').classList.remove('hidden')
                document.getElementById('error').classList.add('hidden')
                document.getElementById('content').classList.add('hidden')

                const response = await fetch(\`/api/pv/plants/\${plantId}\`)
                const data = await response.json()
                
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Erreur chargement centrale')
                }
                
                plantData = data.plant
                zones = data.zones || []
                
                renderPlantHeader()
                renderZonesList()
                updateStats()
                
                document.getElementById('loading').classList.add('hidden')
                document.getElementById('content').classList.remove('hidden')
            } catch (error) {
                console.error('Erreur:', error)
                document.getElementById('loading').classList.add('hidden')
                document.getElementById('error').classList.remove('hidden')
                document.getElementById('errorMessage').textContent = error.message
            }
        }

        function renderPlantHeader() {
            const typeIcons = {
                rooftop: "fa-building",
                ground: "fa-mountain",
                carport: "fa-car"
            }
            
            const typeLabels = {
                rooftop: "Toiture",
                ground: "Sol",
                carport: "Ombrière"
            }
            
            document.getElementById('plantName').textContent = plantData.plant_name
            
            document.getElementById('plantType').innerHTML = \`
                <i class="fas \${typeIcons[plantData.plant_type] || 'fa-solar-panel'} mr-2"></i>
                Type: \${typeLabels[plantData.plant_type] || plantData.plant_type}
            \`
            
            const addressParts = []
            if (plantData.address) addressParts.push(plantData.address)
            if (plantData.city) addressParts.push(plantData.city)
            if (plantData.postal_code) addressParts.push(plantData.postal_code)
            
            if (addressParts.length > 0) {
                document.getElementById('plantAddress').innerHTML = \`
                    <i class="fas fa-map-marker-alt mr-2"></i>\${addressParts.join(', ')}
                \`
            } else {
                document.getElementById('plantAddress').innerHTML = \`
                    <i class="fas fa-map-marker-alt mr-2"></i>Adresse non renseignée
                \`
            }
            
            // Gestion bouton Créer Audit EL
            const createBtn = document.getElementById('createAuditBtn')
            if (createBtn) {
                const totalModules = zones.reduce((sum, z) => sum + (parseInt(z.module_count) || 0), 0)
                
                if (totalModules === 0) {
                    createBtn.disabled = true
                    createBtn.classList.add('opacity-50', 'cursor-not-allowed')
                    createBtn.title = "Aucun module dans cette centrale. Créez des zones et positionnez des modules d" + String.fromCharCode(39) + "abord."
                } else {
                    createBtn.disabled = false
                    createBtn.classList.remove('opacity-50', 'cursor-not-allowed')
                    createBtn.title = \`Créer un audit EL depuis cette centrale (\${totalModules} modules)\`
                }
            }
        }

        function updateStats() {
            const totalModules = zones.reduce((sum, z) => sum + (parseInt(z.module_count) || 0), 0)
            const totalPower = zones.reduce((sum, z) => sum + (parseFloat(z.total_power_wp) || 0), 0)
            const totalArea = zones.reduce((sum, z) => sum + (parseFloat(z.area_sqm) || 0), 0)
            
            document.getElementById('statsZones').textContent = zones.length
            document.getElementById('statsModules').textContent = totalModules
            document.getElementById('statsPower').textContent = (totalPower / 1000).toFixed(1)
            document.getElementById('statsArea').textContent = totalArea.toFixed(0)
        }

        function renderZonesList() {
            const container = document.getElementById('zonesList')
            const emptyState = document.getElementById('emptyZones')
            
            if (zones.length === 0) {
                container.classList.add('hidden')
                emptyState.classList.remove('hidden')
                return
            }
            
            container.classList.remove('hidden')
            emptyState.classList.add('hidden')
            
            const typeIcons = {
                roof: "fa-building",
                ground: "fa-mountain",
                carport: "fa-car"
            }
            
            const typeLabels = {
                roof: "Toiture",
                ground: "Sol",
                carport: "Ombrière"
            }
            
            container.innerHTML = zones.map(zone => \`
                <div class="bg-gray-900 rounded-lg border-2 border-gray-700 hover:border-blue-400 transition-all p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-black text-blue-400 mb-1">\${zone.zone_name}</h3>
                            <p class="text-sm text-gray-400">
                                <i class="fas \${typeIcons[zone.zone_type] || 'fa-layer-group'} mr-1"></i>
                                \${typeLabels[zone.zone_type] || zone.zone_type}
                            </p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="editZone(\${zone.id})" class="text-orange-400 hover:text-orange-300" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteZone(\${zone.id})" class="text-red-400 hover:text-red-300" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <div class="text-sm text-gray-500">Azimut</div>
                            <div class="text-lg font-bold text-yellow-400">\${zone.azimuth}°</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">Inclinaison</div>
                            <div class="text-lg font-bold text-yellow-400">\${zone.tilt}°</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">Modules</div>
                            <div class="text-lg font-bold text-green-400">\${zone.module_count || 0}</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">Surface</div>
                            <div class="text-lg font-bold text-blue-400">\${zone.area_sqm ? zone.area_sqm.toFixed(0) + ' m²' : "-"}</div>
                        </div>
                    </div>
                    
                    <div class="pt-4 border-t border-gray-700 grid grid-cols-2 gap-2">
                        <a href="/pv/plant/\${plantId}/zone/\${zone.id}/editor" 
                           class="block bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold text-center text-sm">
                            <i class="fas fa-pen-ruler mr-1"></i>V1
                        </a>
                        <a href="/pv/plant/\${plantId}/zone/\${zone.id}/editor/v2" 
                           class="block bg-green-600 hover:bg-green-700 py-2 rounded font-bold text-center text-sm">
                             V2 PRO
                        </a>
                    </div>
                </div>
            \`).join('')
        }

        function showAddZoneModal() {
            document.getElementById('modalTitle').textContent = 'NOUVELLE ZONE'
            document.getElementById('zoneForm').reset()
            document.getElementById('zoneId').value = ''
            document.getElementById('zoneAzimuth').value = '180'
            document.getElementById('zoneTilt').value = '30'
            document.getElementById('zoneModal').classList.remove('hidden')
        }

        async function editZone(zoneId) {
            const zone = zones.find(z => z.id === zoneId)
            if (!zone) return
            
            document.getElementById('modalTitle').textContent = 'MODIFIER ZONE'
            document.getElementById('zoneId').value = zone.id
            document.getElementById('zoneName').value = zone.zone_name
            document.getElementById('zoneType').value = zone.zone_type
            document.getElementById('zoneAzimuth').value = zone.azimuth
            document.getElementById('zoneTilt').value = zone.tilt
            document.getElementById('zoneArea').value = zone.area_sqm || ''
            document.getElementById('zoneNotes').value = zone.notes || ''
            document.getElementById('zoneModal').classList.remove('hidden')
        }

        async function deleteZone(zoneId) {
            if (!confirm('Supprimer cette zone ? Tous les modules associés seront supprimés.')) return
            
            try {
                const response = await fetch(\`/api/pv/plants/\${plantId}/zones/\${zoneId}\`, {
                    method: "DELETE"
                })
                
                const data = await response.json()
                
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Erreur suppression zone')
                }
                
                alert('Zone supprimée avec succès')
                loadPlantDetail()
            } catch (error) {
                console.error('Erreur:', error)
                alert( "Erreur: " + error.message)
            }
        }

        function hideZoneModal() {
            document.getElementById('zoneModal').classList.add('hidden')
            document.getElementById('zoneForm').reset()
        }

        async function saveZone(formData) {
            try {
                const zoneId = document.getElementById('zoneId').value
                const isEdit = !!zoneId
                
                const url = isEdit 
                    ? \`/api/pv/plants/\${plantId}/zones/\${zoneId}\`
                    : \`/api/pv/plants/\${plantId}/zones\`
                
                const method = isEdit ? 'PUT' : "POST"
                
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': "application/json" },
                    body: JSON.stringify(formData)
                })
                
                const data = await response.json()
                
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Erreur enregistrement zone')
                }
                
                alert(isEdit ? 'Zone modifiée avec succès' : "Zone créée avec succès")
                hideZoneModal()
                loadPlantDetail()
            } catch (error) {
                console.error('Erreur:', error)
                alert( "Erreur: " + error.message)
            }
        }

        function viewZoneModules(zoneId) {
            alert('Placement modules disponible en Phase 2b (Canvas Editor)')
        }

        // Event Listeners
        document.getElementById('addZoneBtn').addEventListener('click', showAddZoneModal)
        document.getElementById('cancelZoneBtn').addEventListener('click', hideZoneModal)
        
        // Créer Audit EL depuis centrale PV (Sync Reverse)
        const createAuditBtnEl = document.getElementById('createAuditBtn')
        if (createAuditBtnEl) {
            createAuditBtnEl.addEventListener('click', async () => {
                if (!confirm("Créer un nouvel audit EL depuis cette centrale PV ? Toutes les zones et modules seront importes automatiquement.")) {
                    return
                }
                
                const btn = document.getElementById('createAuditBtn')
                const originalText = btn.innerHTML
                btn.disabled = true
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>CRÉATION...'
                
                try {
                    const response = await fetch('/api/sync-reverse/create-audit-from-plant', {
                        method: "POST",
                        headers: { 'Content-Type': "application/json" },
                        body: JSON.stringify({
                            plantId: parseInt(plantId),
                            projectName: plantData.plant_name || 'Audit EL',
                            clientName: "Client",
                            location: [plantData.address, plantData.city].filter(Boolean).join(', ') || 'À définir'
                        })
                    })
                    
                    const data = await response.json()
                    
                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Erreur création audit')
                    }
                    
                    alert("✅ Audit EL créé avec succès !" + String.fromCharCode(10,10) + "Token: " + data.auditToken + String.fromCharCode(10) + "Modules importés: " + data.modulesCreated + String.fromCharCode(10) + "Strings: " + data.stringCount + String.fromCharCode(10,10) + "Redirection vers l" + String.fromCharCode(39) + "audit...")
                    window.location.href = data.auditUrl
                } catch (error) {
                    console.error('Erreur:', error)
                    alert( "❌ Erreur: " + error.message)
                    btn.disabled = false
                    btn.innerHTML = originalText
                }
            })
        }
        
        document.getElementById('zoneForm').addEventListener('submit', (e) => {
            e.preventDefault()
            
            const formData = {
                zone_name: document.getElementById('zoneName').value,
                zone_type: document.getElementById('zoneType').value,
                azimuth: parseInt(document.getElementById('zoneAzimuth').value),
                tilt: parseInt(document.getElementById('zoneTilt').value),
                area_sqm: parseFloat(document.getElementById('zoneArea').value) || null,
                notes: document.getElementById('zoneNotes').value || null
            }
            
            saveZone(formData)
        })

        // Init
        loadPlantDetail()
        
        }) // End DOMContentLoaded
        <\/script>
    </body>
    </html>
  `)
})

// ============================================================================
// OPENSOLAR DXF IMPORT - PAGE INTERFACE
// ============================================================================
app.get('/opensolar', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OpenSolar DXF Import | DiagPV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            #map { height: 500px; width: 100%; }
            .status-pending { background: #6b7280; }
            .status-ok { background: #10b981; }
            .status-warning { background: #f59e0b; }
            .status-critical { background: #ef4444; }
        </style>
    </head>
    <body class="bg-gray-900 text-white">
        <div class="container mx-auto p-8">
            <header class="mb-8">
                <h1 class="text-4xl font-black text-orange-400 mb-2">
                    <i class="fas fa-file-import mr-3"></i>
                    OpenSolar DXF Import
                </h1>
                <p class="text-gray-400">Module isolé pour import de fichiers DXF OpenSolar</p>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Upload Section -->
                <div class="bg-gray-800 rounded-lg p-6 border-2 border-orange-400">
                    <h2 class="text-2xl font-bold mb-4 text-orange-400">
                        <i class="fas fa-upload mr-2"></i>Upload DXF
                    </h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm mb-2">Zone ID (référence GPS)</label>
                            <input type="number" id="zoneId" 
                                   class="w-full bg-gray-900 border border-gray-600 rounded px-4 py-2"
                                   placeholder="ex: 1" value="1">
                        </div>

                        <div>
                            <label class="block text-sm mb-2">Fichier DXF OpenSolar</label>
                            <input type="file" id="dxfFile" accept=".dxf"
                                   class="w-full bg-gray-900 border border-gray-600 rounded px-4 py-2">
                        </div>

                        <button id="parseBtn" 
                                class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded">
                            <i class="fas fa-cogs mr-2"></i>Parser DXF
                        </button>

                        <button id="importBtn" disabled
                                class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold py-3 rounded">
                            <i class="fas fa-database mr-2"></i>Importer dans DB
                        </button>
                    </div>

                    <div id="status" class="mt-4 p-4 bg-gray-900 rounded text-sm">
                        <p class="text-gray-500">En attente de fichier DXF...</p>
                    </div>
                </div>

                <!-- Results Section -->
                <div class="bg-gray-800 rounded-lg p-6 border-2 border-blue-400">
                    <h2 class="text-2xl font-bold mb-4 text-blue-400">
                        <i class="fas fa-chart-bar mr-2"></i>Résultats
                    </h2>
                    
                    <div id="stats" class="space-y-2 mb-4">
                        <p class="text-gray-500">Aucune donnée</p>
                    </div>

                    <div id="modulesList" class="bg-gray-900 rounded p-4 max-h-96 overflow-y-auto">
                        <p class="text-gray-500 text-sm">Liste des modules apparaîtra ici</p>
                    </div>
                </div>
            </div>

            <!-- Map Visualization -->
            <div class="mt-6 bg-gray-800 rounded-lg p-6 border-2 border-purple-400">
                <h2 class="text-2xl font-bold mb-4 text-purple-400">
                    <i class="fas fa-map mr-2"></i>Visualisation Carte
                </h2>
                <div id="map"></div>
            </div>
        </div>

        <script>
            // Init Leaflet map
            const map = L.map('map').setView([48.8566, 2.3522], 13)
            L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                maxZoom: 22,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: "Google Satellite"
            }).addTo(map)

            let parsedModules = []
            const markers = L.layerGroup().addTo(map)

            // Parse DXF
            document.getElementById('parseBtn').addEventListener('click', async () => {
                const file = document.getElementById('dxfFile').files[0]
                const zoneId = parseInt(document.getElementById('zoneId').value)

                if (!file) {
                    alert('Sélectionnez un fichier DXF')
                    return
                }

                const status = document.getElementById('status')
                status.innerHTML = '<p class="text-yellow-400"><i class="fas fa-spinner fa-spin mr-2"></i>Parsing en cours...</p>'

                try {
                    const content = await file.text()
                    
                    const response = await fetch('/api/opensolar/parse-dxf', {
                        method: "POST",
                        headers: { 'Content-Type': "application/json" },
                        body: JSON.stringify({ dxfContent: content, zoneId })
                    })

                    const data = await response.json()

                    if (data.error) {
                        throw new Error(data.error)
                    }

                    parsedModules = data.modules
                    
                    // Afficher stats
                    document.getElementById('stats').innerHTML = \`
                        <div class="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p class="text-3xl font-bold text-orange-400">\${data.stats.totalModules}</p>
                                <p class="text-xs text-gray-400">Modules</p>
                            </div>
                            <div>
                                <p class="text-3xl font-bold text-blue-400">\${data.stats.strings}</p>
                                <p class="text-xs text-gray-400">Strings</p>
                            </div>
                            <div>
                                <p class="text-3xl font-bold text-green-400">\${data.stats.totalPower}</p>
                                <p class="text-xs text-gray-400">Wc</p>
                            </div>
                        </div>
                    \`

                    // Afficher liste modules
                    const modulesList = data.modules.map(m => \`
                        <div class="mb-2 p-2 bg-gray-800 rounded text-xs">
                            <span class="font-bold text-orange-400">\${m.module_identifier}</span>
                            <span class="text-gray-400">| \${m.latitude.toFixed(6)}, \${m.longitude.toFixed(6)}</span>
                        </div>
                    \`).join('')
                    document.getElementById('modulesList').innerHTML = modulesList

                    // Afficher sur carte
                    markers.clearLayers()
                    data.modules.forEach(m => {
                        const marker = L.circleMarker([m.latitude, m.longitude], {
                            radius: 8,
                            fillColor: "#f97316",
                            color: "#fff",
                            weight: 2,
                            fillOpacity: 0.8
                        }).bindPopup(\`
                            <b>\${m.module_identifier}</b><br>
                            String \${m.string_number} | Pos \${m.position_in_string}<br>
                            \${m.power_wp}Wc
                        \`)
                        markers.addLayer(marker)
                    })

                    // Center map
                    if (data.modules.length > 0) {
                        map.setView([data.modules[0].latitude, data.modules[0].longitude], 20)
                    }

                    status.innerHTML = '<p class="text-green-400"><i class="fas fa-check mr-2"></i>Parsing réussi!</p>'
                    document.getElementById('importBtn').disabled = false

                } catch (error) {
                    status.innerHTML = \`<p class="text-red-400"><i class="fas fa-exclamation-triangle mr-2"></i>Erreur: \${error.message}</p>\`
                }
            })

            // Import to DB
            document.getElementById('importBtn').addEventListener('click', async () => {
                const zoneId = parseInt(document.getElementById('zoneId').value)
                const status = document.getElementById('status')

                status.innerHTML = '<p class="text-yellow-400"><i class="fas fa-spinner fa-spin mr-2"></i>Import en cours...</p>'

                try {
                    const response = await fetch('/api/opensolar/import-modules', {
                        method: "POST",
                        headers: { 'Content-Type': "application/json" },
                        body: JSON.stringify({ zoneId, modules: parsedModules })
                    })

                    const data = await response.json()

                    if (data.error) {
                        throw new Error(data.error)
                    }

                    status.innerHTML = \`<p class="text-green-400"><i class="fas fa-check-double mr-2"></i>\${data.insertedCount} modules importés!</p>\`

                } catch (error) {
                    status.innerHTML = \`<p class="text-red-400"><i class="fas fa-exclamation-triangle mr-2"></i>Erreur: \${error.message}</p>\`
                }
            })
        <\/script>
    </body>
    </html>
  `)
})

export default app