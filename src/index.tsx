import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { PVservParser } from './pvserv-parser.js'
import elModule from './modules/el'
import authRoutes from './modules/auth/routes'
import adminAuthRoutes from './modules/auth/admin-routes'
import assignmentsRoutes from './modules/auth/assignments-routes'
import crmRoutes from './modules/crm/routes'
import planningRoutes from './modules/planning/routes'
import unifiedModulesRoutes from './modules/unified-modules-routes'
import { getLoginPage } from './pages/login'
import { getChangePasswordPage } from './pages/change-password'
import { getAdminUsersPage } from './pages/admin-users'
import { getAdminAssignmentsPage } from './pages/admin-assignments'
import { getPlanningDashboardPage } from './pages/planning-dashboard'
import { getPlanningCreatePage } from './pages/planning-create'
import { getPlanningDetailPage } from './pages/planning-detail'
import { getPlanningCalendarPage } from './pages/planning-calendar'
import { getCrmDashboardPage } from './pages/crm-dashboard'
import { getAuditsCreatePage } from './pages/audits-create'
import { getCrmClientsListPage } from './pages/crm-clients-list'
import { getCrmClientsCreatePage } from './pages/crm-clients-create'
import { getCrmClientsDetailPage } from './pages/crm-clients-detail'
import { getCrmClientsEditPage } from './pages/crm-clients-edit'
import { getCrmProjectsListPage } from './pages/crm-projects-list'
import { getCrmProjectsCreatePage } from './pages/crm-projects-create'
import { getCrmProjectsDetailPage } from './pages/crm-projects-detail'
import { getCrmProjectsEditPage } from './pages/crm-projects-edit'

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

// ============================================================================
// MODULE AUTH - AUTHENTIFICATION & PERMISSIONS (Phase 6)
// ============================================================================
app.route('/api/auth', authRoutes)
app.route('/api/auth/admin', adminAuthRoutes)
app.route('/api/auth/admin/assignments', assignmentsRoutes)

// ============================================================================
// MODULE CRM - GESTION CLIENTS & CONTACTS
// ============================================================================
app.route('/api/crm', crmRoutes)

// ============================================================================
// MODULE PLANNING - PLANNING & ATTRIBUTION SOUS-TRAITANTS (Priorité #1)
// ============================================================================
app.route('/api/planning', planningRoutes)

// ============================================================================
// MODULE EL - ARCHITECTURE MODULAIRE (Point 4.1 + 4.3)
// ============================================================================
app.route('/api/el', elModule)

// ============================================================================
// MODULE AUDITS - GESTION AUDITS MULTI-MODULES (MASTER)
// ============================================================================
import auditsRoutes from './modules/audits/routes'
app.route('/api/audits', auditsRoutes)

// ============================================================================
// MODULE I-V - COURBES I-V (RÉFÉRENCE & SOMBRES)
// ============================================================================
import ivRoutes from './modules/iv/routes'
app.route('/api/iv', ivRoutes)

// ============================================================================
// MODULE VISUAL - INSPECTIONS VISUELLES
// ============================================================================
import visualRoutes from './modules/visual/routes'
app.route('/api/visual', visualRoutes)

// ============================================================================
// MODULE ISOLATION - TESTS D'ISOLEMENT
// ============================================================================
import isolationRoutes from './modules/isolation/routes'
app.route('/api/isolation', isolationRoutes)

// ============================================================================
// MODULE UNIFIED MODULES - DONNÉES COMPLÈTES MODULES (EL + I-V + PVserv)
// Vue unifiée de tous les diagnostics d'un module physique
// ============================================================================
app.route('/api/modules', unifiedModulesRoutes)

// ============================================================================
// ANCIENNES ROUTES API RETIRÉES - REMPLACÉES PAR MODULE MODULAIRE
// ============================================================================
// Les routes suivantes ont été migrées vers src/modules/el/ (Point 4.1)
// et montées sous /api/el/ (voir ligne 27)
//
// ROUTES MIGRÉES:
// - POST /api/el/audit/create-from-json
// - POST /api/el/audit/create
// - GET /api/el/dashboard/audits
// - GET /api/el/audit/:token
// - PUT /api/el/audit/:token
// - DELETE /api/el/audit/:token
// - POST /api/el/audit/:token/module/:moduleId
// - POST /api/el/audit/:token/module
// - POST /api/el/audit/:token/bulk-update
//
// ROUTES CONSERVÉES (PVserv parser):
// - POST /api/audit/:token/parse-pvserv
// - POST /api/audit/:token/save-measurements
// - GET /api/audit/:token/measurements
// - GET /api/audit/:token/report
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

// Sauvegarder mesures PVserv avec génération automatique module_identifier
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

    // Insertion nouvelles mesures avec génération module_identifier
    const parser = new PVservParser()
    const dbData = parser.formatForDatabase(measurements, token)

    let linkedCount = 0
    let unlinkedCount = 0

    for (const measurement of dbData) {
      // Génération module_identifier depuis string_number + module_number
      const moduleIdentifier = measurement.string_number && measurement.module_number
        ? `S${measurement.string_number}-${measurement.module_number}`
        : null

      // Vérifier si ce module existe dans el_modules
      let elModuleExists = false
      if (moduleIdentifier) {
        const elModule = await env.DB.prepare(`
          SELECT id FROM el_modules 
          WHERE audit_token = ? AND module_identifier = ?
        `).bind(token, moduleIdentifier).first()
        
        elModuleExists = !!elModule
        if (elModuleExists) {
          linkedCount++
        } else {
          unlinkedCount++
        }
      } else {
        unlinkedCount++
      }

      await env.DB.prepare(`
        INSERT INTO pvserv_measurements (
          audit_token, string_number, module_number, module_identifier,
          ff, rds, uf,
          measurement_type, iv_curve_data, raw_line, line_number, valid
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        measurement.audit_token, measurement.string_number, measurement.module_number,
        moduleIdentifier, // NOUVEAU: module_identifier généré
        measurement.ff, measurement.rds, measurement.uf, measurement.measurement_type,
        measurement.iv_curve_data, measurement.raw_line, measurement.line_number,
        measurement.valid ? 1 : 0
      ).run()
    }

    return c.json({ 
      success: true, 
      saved: dbData.length,
      linked_to_el_modules: linkedCount,
      unlinked: unlinkedCount,
      message: linkedCount > 0 
        ? `✅ ${linkedCount}/${dbData.length} mesures liées à des modules EL existants`
        : `⚠️ Aucun module EL trouvé pour cet audit (${unlinkedCount} mesures non liées)`
    })

  } catch (error: any) {
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
// INTERFACE FRONTEND
// ============================================================================

// ============================================================================
// PAGE LOGIN - AUTHENTIFICATION
// IMPORTANT: Auth DÉSACTIVÉ par défaut (AUTH_ENABLED=false dans middleware)
// Cette page existe mais l'authentification n'est pas requise pour l'instant
// ============================================================================
app.get('/login', (c) => {
  return c.html(getLoginPage())
})

// ============================================================================
// PAGE CHANGE PASSWORD
// Force changement si must_change_password=true après login
// ============================================================================
app.get('/change-password', (c) => {
  return c.html(getChangePasswordPage())
})

// ============================================================================
// PAGE ADMIN USERS - GESTION UTILISATEURS
// Interface admin pour CRUD des 20+ sous-traitants
// ============================================================================
app.get('/admin/users', (c) => {
  return c.html(getAdminUsersPage())
})

// ============================================================================
// PAGE ADMIN ASSIGNMENTS - GESTION ASSIGNATIONS
// Interface admin pour assigner sous-traitants aux audits EL
// ============================================================================
app.get('/admin/assignments', (c) => {
  return c.html(getAdminAssignmentsPage())
})

// ============================================================================
// PAGE PLANNING DASHBOARD - PLANNING & ATTRIBUTION SOUS-TRAITANTS
// Interface planning/calendrier avec filtres et statistiques temps réel
// ============================================================================
app.get('/planning', (c) => {
  return c.html(getPlanningDashboardPage())
})

// ============================================================================
// PAGE PLANNING CREATE - CRÉATION INTERVENTION
// Formulaire avec selects dynamiques CRM → Projets → Techniciens + conflits
// ============================================================================
app.get('/planning/create', (c) => {
  return c.html(getPlanningCreatePage())
})

// ============================================================================
// PAGE PLANNING DETAIL - DÉTAIL INTERVENTION
// Affichage complet intervention + Attribution technicien + Lien audit EL
// ============================================================================
app.get('/planning/detail', (c) => {
  return c.html(getPlanningDetailPage())
})

// ============================================================================
// PAGE PLANNING CALENDAR - VUE CALENDRIER
// Calendrier mensuel avec filtres technicien et type d'intervention
// ============================================================================
app.get('/planning/calendar', (c) => {
  return c.html(getPlanningCalendarPage())
})

// ============================================================================
// PAGE CRM DASHBOARD - PAGE CENTRALE APPLICATION
// Hub central avec KPIs, audits en cours, planning, actions rapides
// ============================================================================
app.get('/crm/dashboard', (c) => {
  return c.html(getCrmDashboardPage())
})

// ============================================================================
// PAGE CRÉATION AUDIT MULTI-MODULES
// Formulaire avec sélection intervention OU saisie manuelle + modules
// ============================================================================
app.get('/audits/create', (c) => {
  return c.html(getAuditsCreatePage())
})

// ============================================================================
// PAGE CRM CLIENTS LIST - LISTE CLIENTS
// Interface CRM centralisée avec stats, recherche, filtres et CRUD
// ============================================================================
app.get('/crm/clients', (c) => {
  return c.html(getCrmClientsListPage())
})

// ============================================================================
// PAGE CRM CLIENTS CREATE - CRÉER CLIENT
// Formulaire création client avec infos société, contact, adresse
// ============================================================================
app.get('/crm/clients/create', (c) => {
  return c.html(getCrmClientsCreatePage())
})

// ============================================================================
// PAGE CRM CLIENTS DETAIL - DÉTAIL CLIENT
// Vue complète avec sites, contacts, interventions et audits
// ============================================================================
app.get('/crm/clients/detail', (c) => {
  return c.html(getCrmClientsDetailPage())
})

// ============================================================================
// PAGE CRM CLIENTS EDIT - MODIFIER CLIENT
// Formulaire édition pré-rempli avec validation
// ============================================================================
app.get('/crm/clients/edit', (c) => {
  return c.html(getCrmClientsEditPage())
})

// ============================================================================
// PAGE CRM PROJECTS LIST - LISTE SITES/PROJETS
// Vue d'ensemble tous sites avec stats et filtres
// ============================================================================
app.get('/crm/projects', (c) => {
  return c.html(getCrmProjectsListPage())
})

// ============================================================================
// PAGE CRM PROJECTS CREATE - CRÉER SITE/PROJET
// Formulaire création site lié à client
// ============================================================================
app.get('/crm/projects/create', (c) => {
  return c.html(getCrmProjectsCreatePage())
})

// ============================================================================
// PAGE CRM PROJECTS DETAIL - DÉTAIL SITE/PROJET
// Vue complète avec interventions et audits
// ============================================================================
app.get('/crm/projects/detail', (c) => {
  return c.html(getCrmProjectsDetailPage())
})

// ============================================================================
// PAGE CRM PROJECTS EDIT - MODIFIER SITE/PROJET
// Formulaire édition site pré-rempli
// ============================================================================
app.get('/crm/projects/edit', (c) => {
  return c.html(getCrmProjectsEditPage())
})

// ============================================================================
// PAGE D'ACCUEIL - DIAGNOSTIC HUB
// ============================================================================
// ============================================================================
// HOMEPAGE - REDIRECTION VERS CRM DASHBOARD
// ============================================================================
app.get('/', (c) => {
  return c.redirect('/crm/dashboard')
})

// ============================================================================
// ANCIENNE HOMEPAGE (Conservée pour référence si besoin)
// ============================================================================
app.get('/old-home', (c) => {
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
            content: "✓" !important;
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
            
            <!-- SECTION GESTION (BASE) -->
            <div class="max-w-6xl mx-auto mb-12">
                <h2 class="text-3xl font-black mb-6 text-center text-blue-400">
                    <i class="fas fa-cogs mr-2"></i>
                    GESTION & ORGANISATION
                </h2>
                <p class="text-center text-gray-400 mb-6">Base de données clients et planification des interventions</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <!-- CRM - GESTION CLIENTS -->
                    <a href="/crm/clients" class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-8 border-4 border-blue-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-blue-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-users text-4xl text-white"></i>
                            </div>
                            <h3 class="text-3xl font-black mb-2 text-white">CRM CLIENTS</h3>
                            <p class="text-lg text-blue-200 mb-3">Base Clients & Sites</p>
                            <div class="bg-blue-500 text-white px-6 py-3 rounded-full font-black text-base inline-block mb-4">
                                <i class="fas fa-database mr-2"></i> BASE DE DONNÉES
                            </div>
                            <p class="text-base text-blue-100">Gestion clients, sites et projets photovoltaïques</p>
                        </div>
                    </a>
                    
                    <!-- PLANNING - INTERVENTIONS -->
                    <a href="/planning" class="bg-gradient-to-br from-purple-900 to-purple-700 rounded-lg p-8 border-4 border-purple-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-purple-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-calendar-alt text-4xl text-white"></i>
                            </div>
                            <h3 class="text-3xl font-black mb-2 text-white">PLANNING</h3>
                            <p class="text-lg text-purple-200 mb-3">Interventions Terrain</p>
                            <div class="bg-purple-500 text-white px-6 py-3 rounded-full font-black text-base inline-block mb-4">
                                <i class="fas fa-calendar-check mr-2"></i> PLANIFICATION
                            </div>
                            <p class="text-base text-purple-100">Planification audits et attribution sous-traitants</p>
                        </div>
                    </a>
                </div>
            </div>
            
            <!-- SECTION MODULES D'AUDIT -->
            <div class="max-w-6xl mx-auto">
                <h2 class="text-3xl font-black mb-6 text-center text-yellow-400">
                    <i class="fas fa-th mr-2"></i>
                    MODULES D'AUDIT
                </h2>
                <p class="text-center text-gray-400 mb-6">Outils techniques d'inspection et mesures terrain</p>
                
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
                    
                    <!-- Module I-V - OPÉRATIONNEL -->
                    <a href="/iv" class="bg-gradient-to-br from-orange-900 to-orange-700 rounded-lg p-8 border-4 border-orange-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-orange-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-chart-line text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE I-V</h3>
                            <p class="text-lg text-orange-200 mb-3">Courbes I-V</p>
                            <div class="bg-orange-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-orange-100">Import PVserv, mesures électriques et analyse performances</p>
                        </div>
                    </a>
                    
                    <!-- Module Thermographie -->
                    <div class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-8 border-4 border-gray-500 opacity-75">
                        <div class="text-center">
                            <div class="bg-gray-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-thermometer-half text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE THERMIQUE</h3>
                            <p class="text-lg text-gray-300 mb-3">Thermographie IR</p>
                            <div class="bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-clock mr-1"></i> PROCHAINEMENT
                            </div>
                            <p class="text-sm text-gray-300">Détection points chauds et anomalies thermiques</p>
                        </div>
                    </div>
                    
                    <!-- Module Visuels - OPÉRATIONNEL -->
                    <a href="/visual" class="bg-gradient-to-br from-teal-900 to-teal-700 rounded-lg p-8 border-4 border-teal-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-teal-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-eye text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE VISUELS</h3>
                            <p class="text-lg text-teal-200 mb-3">Contrôles Visuels</p>
                            <div class="bg-teal-500 text-black px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-teal-100">Inspection visuelle terrain et défauts mécaniques</p>
                        </div>
                    </a>
                    
                    <!-- Module Isolation - OPÉRATIONNEL -->
                    <a href="/isolation" class="bg-gradient-to-br from-red-900 to-red-700 rounded-lg p-8 border-4 border-red-400 hover:scale-105 transition-transform duration-200 shadow-2xl">
                        <div class="text-center">
                            <div class="bg-red-600 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <i class="fas fa-bolt text-4xl text-white"></i>
                            </div>
                            <h3 class="text-2xl font-black mb-2 text-white">MODULE ISOLATION</h3>
                            <p class="text-lg text-red-200 mb-3">Tests d'Isolation</p>
                            <div class="bg-red-500 text-white px-4 py-2 rounded-full font-black text-sm inline-block mb-4">
                                <i class="fas fa-check-circle mr-1"></i> OPÉRATIONNEL
                            </div>
                            <p class="text-sm text-red-100">Mesures résistance isolation et défauts électriques</p>
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
                    <div class="grid md:grid-cols-3 gap-6">
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
                        
                        <div class="bg-gray-800 rounded-lg p-6 border border-blue-400 hover:bg-gray-750 transition-colors">
                            <h3 class="text-xl font-bold mb-3 text-blue-400 flex items-center">
                                <i class="fas fa-calendar-alt mr-2"></i>
                                PLANNING
                            </h3>
                            <p class="text-gray-300 mb-4">Planifier interventions et attribuer sous-traitants</p>
                            <a href="/planning" class="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-black text-lg transition-colors flex items-center justify-center">
                                <i class="fas fa-calendar-check mr-2"></i>
                                ACCÉDER AU PLANNING
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
// ROUTE MODULE EL - INTERFACE CRÉATION AUDIT ÉLECTROLUMINESCENCE
// ============================================================================
app.get('/el', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module EL - Création Audit Électroluminescence</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/diagpv-styles.css" rel="stylesheet">
        <meta name="theme-color" content="#000000">
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <!-- En-tête retour Hub -->
            <div class="mb-6">
                <a href="/" class="inline-flex items-center text-yellow-400 hover:text-yellow-300 text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Retour au Diagnostic Hub
                </a>
            </div>
            
            <!-- En-tête Module EL -->
            <header class="mb-8 text-center">
                <div class="inline-flex items-center mb-4">
                    <i class="fas fa-moon text-4xl text-green-400 mr-4"></i>
                    <h1 class="text-4xl font-black">MODULE EL - ÉLECTROLUMINESCENCE</h1>
                </div>
                <p class="text-xl text-gray-300">Interface Terrain Nocturne - Audit Photovoltaïque</p>
                <p class="text-lg text-blue-400 mt-2">
                    <i class="fas fa-globe mr-2"></i>
                    www.diagnosticphotovoltaique.fr
                </p>
            </header>
            
            <!-- Interface création audit (contenu identique à l'ancienne page /) -->
            <div class="max-w-4xl mx-auto">
                <div class="bg-gray-900 rounded-lg p-8 border-2 border-green-400">
                    <h2 class="text-2xl font-black mb-6 text-center">
                        <i class="fas fa-plus-circle mr-2 text-green-400"></i>
                        NOUVEL AUDIT ÉLECTROLUMINESCENCE
                    </h2>
                    
                    <form id="createAuditForm" class="space-y-6">
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-lg font-bold mb-2">Nom du projet :</label>
                                <input type="text" id="projectName" required 
                                       class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-green-400 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-lg font-bold mb-2">Client :</label>
                                <input type="text" id="clientName" required 
                                       class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-green-400 focus:outline-none">
                            </div>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-lg font-bold mb-2">Localisation :</label>
                                <input type="text" id="location" required 
                                       class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-green-400 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-lg font-bold mb-2">Date :</label>
                                <input type="date" id="auditDate" required 
                                       class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 text-lg focus:border-green-400 focus:outline-none">
                            </div>
                        </div>
                        
                        <div class="bg-gray-800 rounded-lg p-6 border border-gray-600">
                            <h3 class="text-xl font-bold mb-4 text-green-400">CONFIGURATION OU UPLOAD PLAN</h3>
                            
                            <div class="mb-6">
                                <h4 class="text-lg font-bold mb-3">Option A - Configuration manuelle :</h4>
                                
                                <div id="simpleConfig" class="grid md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label class="block text-sm font-bold mb-2">Nombre de strings :</label>
                                        <input type="number" id="stringCount" min="1" max="100" 
                                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-green-400 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold mb-2">Modules par string :</label>
                                        <input type="number" id="modulesPerString" min="1" max="50" 
                                               class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg focus:border-green-400 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold mb-2">Total modules :</label>
                                        <div id="totalModules" class="bg-black border-2 border-gray-600 rounded px-3 py-2 text-lg text-green-400 font-black">0</div>
                                    </div>
                                </div>
                                
                                <div class="text-center mb-4 space-x-3">
                                    <button type="button" id="toggleAdvancedConfig" 
                                            class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-bold text-sm">
                                        <i class="fas fa-cog mr-2"></i>CONFIGURATION AVANCÉE
                                    </button>
                                    <button type="button" id="loadExampleConfig" 
                                            class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold text-sm">
                                        <i class="fas fa-magic mr-2"></i>EXEMPLE MPPT
                                    </button>
                                </div>
                                
                                <div id="advancedConfig" class="hidden bg-gray-700 rounded-lg p-4 border border-orange-400">
                                    <div class="flex items-center justify-between mb-4">
                                        <h5 class="text-lg font-bold text-orange-400">Configuration par String/MPPT</h5>
                                        <button type="button" id="addStringBtn" 
                                                class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-bold">
                                            <i class="fas fa-plus mr-1"></i>Ajouter String
                                        </button>
                                    </div>
                                    
                                    <div id="stringsList" class="space-y-2 max-h-60 overflow-y-auto">
                                    </div>
                                    
                                    <div class="mt-4 p-3 bg-gray-800 rounded border-l-4 border-green-400">
                                        <div class="flex justify-between items-center">
                                            <span class="text-sm font-bold">TOTAL CONFIGURATION :</span>
                                            <span id="advancedTotal" class="text-green-400 font-black text-lg">0 modules</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="border-t border-gray-600 pt-6">
                                <h4 class="text-lg font-bold mb-3">Option B - Upload plan :</h4>
                                <div class="flex items-center space-x-4">
                                    <input type="file" id="planFile" accept=".pdf,.png,.jpg,.jpeg" class="hidden">
                                    <button type="button" onclick="document.getElementById('planFile').click()" 
                                            class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold text-lg">
                                        <i class="fas fa-paperclip mr-2"></i>CHARGER PLAN PDF/IMAGE
                                    </button>
                                    <span id="planFileName" class="text-gray-400"></span>
                                </div>
                            </div>
                        </div>
                        
                        <button type="submit" 
                                class="w-full bg-green-600 hover:bg-green-700 py-4 rounded-lg font-black text-xl transition-colors">
                            <i class="fas fa-rocket mr-2"></i>CRÉER L'AUDIT
                        </button>
                    </form>
                </div>
                
                <div class="mt-8 grid md:grid-cols-2 gap-6">
                    <div class="bg-gray-900 rounded-lg p-6 border border-gray-600">
                        <h3 class="text-xl font-bold mb-4 flex items-center">
                            <i class="fas fa-history mr-2 text-blue-400"></i>
                            MES AUDITS RÉCENTS
                        </h3>
                        <div id="recentAudits" class="space-y-2 mb-4">
                            <p class="text-gray-400">Aucun audit récent trouvé</p>
                        </div>
                    </div>
                    
                    <div class="bg-gray-900 rounded-lg p-6 border border-orange-400">
                        <h3 class="text-xl font-bold mb-4 text-orange-400 flex items-center">
                            <i class="fas fa-tachometer-alt mr-2"></i>
                            TABLEAU DE BORD
                        </h3>
                        <p class="text-gray-300 mb-4">Gérez tous vos audits en cours</p>
                        <a href="/dashboard" class="w-full bg-orange-600 hover:bg-orange-700 py-3 rounded-lg font-black text-lg flex items-center justify-center">
                            <i class="fas fa-chart-line mr-2"></i>
                            ACCÉDER AU DASHBOARD
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <script src="/static/diagpv-app.js"></script>
    </body>
    </html>
  `)
})

// ============================================================================
// PAGE MODULE I-V - COURBES I-V
// ============================================================================
app.get('/iv', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module I-V - Courbes I-V</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <div class="mb-6">
                <a href="/" class="inline-flex items-center text-yellow-400 hover:text-yellow-300 text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Retour au Diagnostic Hub
                </a>
            </div>
            
            <header class="mb-8 text-center">
                <div class="inline-flex items-center mb-4">
                    <i class="fas fa-chart-line text-4xl text-orange-400 mr-4"></i>
                    <h1 class="text-4xl font-black">MODULE I-V - COURBES I-V</h1>
                </div>
                <p class="text-xl text-gray-300">Mesures Électriques & Analyse Performances</p>
            </header>
            
            <div class="max-w-4xl mx-auto bg-gray-900 rounded-lg p-8 border-2 border-orange-400">
                <div class="text-center">
                    <i class="fas fa-tools text-6xl text-orange-400 mb-6"></i>
                    <h2 class="text-3xl font-black mb-4">Interface en construction</h2>
                    <p class="text-xl text-gray-300 mb-6">L'API est opérationnelle, l'interface utilisateur arrive bientôt !</p>
                    <p class="text-lg text-gray-400 mb-8">
                        <i class="fas fa-check-circle text-green-400 mr-2"></i>
                        Import CSV PVserv
                        <br>
                        <i class="fas fa-check-circle text-green-400 mr-2"></i>
                        Auto-liaison modules EL
                        <br>
                        <i class="fas fa-check-circle text-green-400 mr-2"></i>
                        Génération rapports PDF
                    </p>
                    <a href="/" class="inline-block bg-orange-600 hover:bg-orange-700 px-8 py-4 rounded-lg font-black text-lg">
                        <i class="fas fa-home mr-2"></i>
                        Retour au Hub
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `)
})

// ============================================================================
// PAGE MODULE VISUELS - CONTRÔLES VISUELS
// ============================================================================
app.get('/visual', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Visuels - Contrôles Visuels</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <div class="mb-6">
                <a href="/" class="inline-flex items-center text-yellow-400 hover:text-yellow-300 text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Retour au Diagnostic Hub
                </a>
            </div>
            
            <header class="mb-8 text-center">
                <div class="inline-flex items-center mb-4">
                    <i class="fas fa-eye text-4xl text-teal-400 mr-4"></i>
                    <h1 class="text-4xl font-black">MODULE VISUELS - CONTRÔLES VISUELS</h1>
                </div>
                <p class="text-xl text-gray-300">Inspection Visuelle & Défauts Mécaniques</p>
            </header>
            
            <div class="max-w-4xl mx-auto bg-gray-900 rounded-lg p-8 border-2 border-teal-400">
                <div class="text-center">
                    <i class="fas fa-tools text-6xl text-teal-400 mb-6"></i>
                    <h2 class="text-3xl font-black mb-4">Interface en construction</h2>
                    <p class="text-xl text-gray-300 mb-6">L'API est opérationnelle, l'interface utilisateur arrive bientôt !</p>
                    <p class="text-lg text-gray-400 mb-8">
                        <i class="fas fa-check-circle text-green-400 mr-2"></i>
                        Saisie observations terrain
                        <br>
                        <i class="fas fa-check-circle text-green-400 mr-2"></i>
                        Photos géolocalisées
                        <br>
                        <i class="fas fa-check-circle text-green-400 mr-2"></i>
                        Génération rapports PDF
                    </p>
                    <a href="/" class="inline-block bg-teal-600 hover:bg-teal-700 px-8 py-4 rounded-lg font-black text-lg">
                        <i class="fas fa-home mr-2"></i>
                        Retour au Hub
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `)
})

// ============================================================================
// PAGE MODULE ISOLATION - TESTS D'ISOLATION
// ============================================================================
app.get('/isolation', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Isolation - Tests d'Isolation</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <div class="mb-6">
                <a href="/" class="inline-flex items-center text-yellow-400 hover:text-yellow-300 text-lg">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Retour au Diagnostic Hub
                </a>
            </div>
            
            <header class="mb-8 text-center">
                <div class="inline-flex items-center mb-4">
                    <i class="fas fa-bolt text-4xl text-red-400 mr-4"></i>
                    <h1 class="text-4xl font-black">MODULE ISOLATION - TESTS D'ISOLATION</h1>
                </div>
                <p class="text-xl text-gray-300">Mesures Résistance Isolation & Défauts Électriques</p>
            </header>
            
            <div class="max-w-4xl mx-auto bg-gray-900 rounded-lg p-8 border-2 border-red-400">
                <div class="text-center">
                    <i class="fas fa-tools text-6xl text-red-400 mb-6"></i>
                    <h2 class="text-3xl font-black mb-4">Interface en construction</h2>
                    <p class="text-xl text-gray-300 mb-6">L'API est opérationnelle, l'interface utilisateur arrive bientôt !</p>
                    <p class="text-lg text-gray-400 mb-8">
                        <i class="fas fa-check-circle text-green-400 mr-2"></i>
                        Tests DC/AC terrain
                        <br>
                        <i class="fas fa-check-circle text-green-400 mr-2"></i>
                        Seuils automatiques
                        <br>
                        <i class="fas fa-check-circle text-green-400 mr-2"></i>
                        Génération rapports PDF
                    </p>
                    <a href="/" class="inline-block bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-black text-lg">
                        <i class="fas fa-home mr-2"></i>
                        Retour au Hub
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `)
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
            content: "✓" !important;
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
                            <span id="technicianIcons">👤</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-2 flex-wrap">
                    <a href="/dashboard" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold flex items-center border-2 border-orange-400 shadow-lg" title="Accéder au tableau de bord - Vue d'ensemble audits">
                        <i class="fas fa-tachometer-alt mr-2 text-lg"></i>TABLEAU DE BORD
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
                            🟢 OK
                        </button>
                        <button class="bulk-action-btn bg-yellow-600 hover:bg-yellow-700 p-2 rounded font-bold text-sm" data-status="inequality" title="Marquer comme inégalité">
                            🟡 Inégalité
                        </button>
                        <button class="bulk-action-btn bg-orange-600 hover:bg-orange-700 p-2 rounded font-bold text-sm" data-status="microcracks" title="Marquer comme microfissures">
                            🟠 Fissures
                        </button>
                        <button class="bulk-action-btn bg-red-600 hover:bg-red-700 p-2 rounded font-bold text-sm" data-status="dead" title="Marquer comme HS">
                            🔴 HS
                        </button>
                        <button class="bulk-action-btn bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold text-sm" data-status="string_open" title="Marquer comme string ouvert">
                            🔵 String
                        </button>
                        <button class="bulk-action-btn bg-gray-600 hover:bg-gray-700 p-2 rounded font-bold text-sm" data-status="not_connected" title="Marquer comme non raccordé">
                            ⚫ Non raccordé
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
                        🟢 OK<br><span class="text-sm font-normal">Aucun défaut détecté</span>
                    </button>
                    <button class="module-status-btn bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold" data-status="inequality">
                        🟡 Inégalité<br><span class="text-sm font-normal">Qualité cellules</span>
                    </button>
                    <button class="module-status-btn bg-orange-600 hover:bg-orange-700 p-3 rounded font-bold" data-status="microcracks">
                        🟠 Microfissures<br><span class="text-sm font-normal">Visibles EL</span>
                    </button>
                    <button class="module-status-btn bg-red-600 hover:bg-red-700 p-3 rounded font-bold" data-status="dead">
                        🔴 HS<br><span class="text-sm font-normal">Module défaillant</span>
                    </button>
                    <button class="module-status-btn bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold" data-status="string_open">
                        🔵 String ouvert<br><span class="text-sm font-normal">Sous-string ouvert</span>
                    </button>
                    <button class="module-status-btn bg-gray-600 hover:bg-gray-700 p-3 rounded font-bold" data-status="not_connected">
                        ⚫ Non raccordé<br><span class="text-sm font-normal">Non connecté</span>
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
        
        <script src="/static/diagpv-audit.js"></script>
        <script src="/static/diagpv-measures.js"></script>
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

  // Créer une grille vide
  const grid = []
  for (let row = maxRow; row >= minRow; row--) { // De haut en bas (inversion visuelle)
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
    const gridRowIndex = maxRow - row  // Inversion pour affichage correct
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
  html += '<h4 style="color: #374151; margin-bottom: 15px;">📋 Vue par String (référence)</h4>'
  
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
            <h1>🏢 DIAGNOSTIC PHOTOVOLTAÏQUE</h1>
            <p>www.diagnosticphotovoltaique.fr</p>
            <h2>⚡ AUDIT ÉLECTROLUMINESCENCE ⚡</h2>
            
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
            <h3>📊 RÉSULTATS AUDIT ÉLECTROLUMINESCENCE</h3>
            <div class="section-content">
                <div class="stats">
                    <div class="stat-card stat-ok">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">🟢</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Modules OK</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #22c55e;">${stats.ok} (${okPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-inequality">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">🟡</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Inégalité cellules</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #eab308;">${stats.inequality} (${inequalityPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-microcracks">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">🟠</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Microfissures</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #f97316;">${stats.microcracks} (${microcracksPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-dead">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">🔴</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Modules HS</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${stats.dead} (${deadPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-string_open">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">🔵</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Strings ouverts</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${stats.string_open} (${stringOpenPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-not_connected">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 2rem;">⚫</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem;">Non raccordés</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #6b7280;">${stats.not_connected} (${notConnectedPercentage}%)</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="total-summary">
                    ⚡ TOTAL MODULES AUDITÉS : ${stats.total} ⚡
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>🗺️ CARTOGRAPHIE MODULES</h3>
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
            <h3>⚠️ MODULES NON-CONFORMES</h3>
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
            <h3>⚡ MESURES ÉLECTRIQUES PVSERV</h3>
            <div class="section-content">
                <div class="stats">
                    <div class="stat-card">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">📊</div>
                            <div style="font-weight: 600;">Total mesures</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${measurements.length}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">⚡</div>
                            <div style="font-weight: 600;">FF moyen</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #22c55e;">${(measurements.reduce((sum, m) => sum + parseFloat(m.ff || 0), 0) / measurements.length).toFixed(3)}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">🔌</div>
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
            <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 1.25rem;">🔐 SIGNATURE NUMÉRIQUE</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; text-align: left; font-size: 0.9rem; color: #4b5563;">
                <div><strong>Génération :</strong> Automatique DiagPV Audit</div>
                <div><strong>Date :</strong> ${date}</div>
                <div><strong>Token :</strong> ${audit.token}</div>
                ${measurements.length > 0 ? `<div><strong>Mesures PVserv :</strong> ${measurements.length} intégrées</div>` : ''}
            </div>
        </div>
        
        <div class="instructions-box">
            <h4>📋 INSTRUCTIONS IMPRESSION COULEURS</h4>
            <p><strong>Pour imprimer les couleurs des modules :</strong></p>
            <div style="margin-left: 15px; line-height: 1.6;">
                <p>• <strong>Chrome/Edge :</strong> Ctrl+P → Plus de paramètres → ✅ Graphiques d'arrière-plan</p>
                <p>• <strong>Firefox :</strong> Ctrl+P → Plus de paramètres → ✅ Imprimer les arrière-plans</p>
                <p>• <strong>Safari :</strong> Cmd+P → Safari → ✅ Imprimer les arrière-plans</p>
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
    'ok': '🟢 OK',
    'inequality': '🟡 Inégalité',
    'microcracks': '🟠 Microfissures',
    'dead': '🔴 HS',
    'string_open': '🔵 String ouvert',
    'not_connected': '⚫ Non raccordé'
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
            content: "✓" !important;
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

export default app