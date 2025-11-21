// ============================================================================
// MODULE EL - INDEX PRINCIPAL
// ============================================================================
// Module Électroluminescence (EL) - Point d'entrée principal
// Monte toutes les routes API sous le préfixe /api/el

import { Hono } from 'hono'
import auditsRouter from './routes/audits'
import modulesRouter from './routes/modules'
import dashboardRouter from './routes/dashboard'
import photosRouter from './routes/photos'
import reportsRouter from './routes/reports'
import completeReportRouter from './routes/report-complete'
import calepinageRouter from './routes/calepinage'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const elModule = new Hono<{ Bindings: Bindings }>()

// Routes dashboard (statistiques globales)
elModule.route('/dashboard', dashboardRouter)

// Routes pour la gestion des audits (inclut les routes modules intégrées)
elModule.route('/audit', auditsRouter)

// Routes pour les modules (GET/PUT modules individuels)
elModule.route('/modules', modulesRouter)

// Routes pour les photos (upload, liste, suppression)
elModule.route('/photos', photosRouter)

// Routes pour les rapports (génération PDF/HTML)
elModule.route('/reports', reportsRouter)
elModule.route('/reports', completeReportRouter)

// Route pour le plan de calepinage (câblage électrique)
elModule.route('/calepinage', calepinageRouter)

export default elModule
