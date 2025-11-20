import { Hono } from 'hono'
import labelsDiagnostiqueursRoutes from './routes-diagnostiqueurs'
import labelsCentralesRoutes from './routes-centrales'

const labelsModule = new Hono()

// Mount diagnostiqueurs routes at /diagnostiqueurs
labelsModule.route('/diagnostiqueurs', labelsDiagnostiqueursRoutes)

// Mount centrales routes at /centrales
labelsModule.route('/centrales', labelsCentralesRoutes)

export default labelsModule
