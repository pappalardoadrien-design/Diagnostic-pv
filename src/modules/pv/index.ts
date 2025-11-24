import { Hono } from 'hono'
import apiRoutes from './routes/api'
import pageRoutes from './routes/pages'

const app = new Hono()

// Monter les routes
app.route('/', apiRoutes)
app.route('/', pageRoutes)

export default app
