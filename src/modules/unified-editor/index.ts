import { Hono } from 'hono'
import { apiRoutes } from './routes/api'
import { viewRoutes } from './routes/views'

const unifiedEditorModule = new Hono()

unifiedEditorModule.route('/api/unified', apiRoutes)
unifiedEditorModule.route('/unified-editor', viewRoutes)

export default unifiedEditorModule
