import { Hono } from 'hono'
import auditsListRouter from './routes/audits-list'

type Bindings = {
  DB: D1Database
}

const dashboardModule = new Hono<{ Bindings: Bindings }>()

dashboardModule.route('/audits', auditsListRouter)

export default dashboardModule
