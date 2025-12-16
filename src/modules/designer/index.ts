import { Hono } from 'hono'
import designerMap from './routes/designer-map'
import designerApi from './routes/api'

const app = new Hono()

// Routes Designer Satellite
app.route('/', designerMap)
app.route('/', designerApi)

export default app
