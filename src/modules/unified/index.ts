// ============================================================================
// UNIFIED MODULE - Index
// Module unifié pour vues transverses (audits EL + centrales PV)
// ============================================================================

import { Hono } from 'hono'
import installationsRouter from './routes/installations'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const unifiedModule = new Hono<{ Bindings: Bindings }>()

// Routes installations (audits EL + centrales PV)
unifiedModule.route('/installations', installationsRouter)

export default unifiedModule
