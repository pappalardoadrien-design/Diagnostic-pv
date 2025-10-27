// ============================================================================
// MODULE EL - INDEX PRINCIPAL
// ============================================================================
// Module Électroluminescence (EL) - Point d'entrée principal
// Monte toutes les routes API sous le préfixe /api/el

import { Hono } from 'hono'
import auditsRouter from './routes/audits'
import modulesRouter from './routes/modules'
import dashboardRouter from './routes/dashboard'

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

export default elModule
