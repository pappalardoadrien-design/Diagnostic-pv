import { Hono } from 'hono'
import designerMap from './routes/designer-map'

const app = new Hono()

// Routes Designer Satellite
app.route('/', designerMap)

export default app
