// Module Calepinage Universel
// Système réutilisable pour EL, I-V, Diodes, Thermographie, etc.

import { Hono } from 'hono'
import apiLayoutsRouter from './routes/api-layouts'
import editorRouter from './routes/editor'
import viewerRouter from './routes/viewer'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const calepinageModule = new Hono<{ Bindings: Bindings }>()

// Routes API pour gestion layouts
calepinageModule.route('/layouts', apiLayoutsRouter)

// Éditeur visuel
calepinageModule.route('/editor', editorRouter)

// Viewer SVG (lecture seule)
calepinageModule.route('/viewer', viewerRouter)

export default calepinageModule
