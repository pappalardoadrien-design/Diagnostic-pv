import { Hono } from 'hono'
import type { CalepinageLayout, LayoutListResponse, LayoutResponse, SaveLayoutRequest, SaveLayoutResponse } from '../types'

type Bindings = {
  DB: D1Database
}

const apiLayoutsRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/calepinage/layouts - Liste tous les layouts
// ============================================================================
apiLayoutsRouter.get('/', async (c) => {
  const { DB } = c.env
  const moduleType = c.req.query('module_type')  // Filtrer par type de module
  
  try {
    let query = 'SELECT * FROM calepinage_layouts'
    const params: string[] = []
    
    if (moduleType) {
      query += ' WHERE module_type = ?'
      params.push(moduleType)
    }
    
    query += ' ORDER BY updated_at DESC'
    
    const statement = params.length > 0 
      ? DB.prepare(query).bind(...params)
      : DB.prepare(query)
    
    const { results } = await statement.all()
    
    const layouts = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      moduleType: row.module_type,
      layoutName: row.layout_name,
      viewBox: JSON.parse(row.view_box_json),
      modules: JSON.parse(row.modules_json),
      arrows: JSON.parse(row.arrows_json || '[]'),
      zones: JSON.parse(row.zones_json || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
    
    const response: LayoutListResponse = {
      success: true,
      layouts,
      total: layouts.length
    }
    
    return c.json(response)
  } catch (error: any) {
    console.error('Erreur récupération layouts:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// GET /api/calepinage/layouts/:projectId - Récupère layout par projectId
// ============================================================================
apiLayoutsRouter.get('/:projectId', async (c) => {
  const { DB } = c.env
  const { projectId } = c.req.param()
  
  try {
    const row = await DB.prepare(`
      SELECT * FROM calepinage_layouts WHERE project_id = ? LIMIT 1
    `).bind(projectId).first()
    
    if (!row) {
      return c.json({ success: false, error: 'Layout non trouvé' }, 404)
    }
    
    const layout: CalepinageLayout = {
      id: row.id as number,
      projectId: row.project_id as string,
      moduleType: row.module_type as any,
      layoutName: row.layout_name as string,
      viewBox: JSON.parse(row.view_box_json as string),
      modules: JSON.parse(row.modules_json as string),
      arrows: JSON.parse(row.arrows_json as string || '[]'),
      zones: JSON.parse(row.zones_json as string || '[]'),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    }
    
    const response: LayoutResponse = {
      success: true,
      layout
    }
    
    return c.json(response)
  } catch (error: any) {
    console.error('Erreur récupération layout:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// POST /api/calepinage/layouts - Créer/mettre à jour layout
// ============================================================================
apiLayoutsRouter.post('/', async (c) => {
  const { DB } = c.env
  
  try {
    const body: SaveLayoutRequest = await c.req.json()
    const { projectId, moduleType, layoutName, layout } = body
    
    // Vérifier si le layout existe déjà
    const existing = await DB.prepare(`
      SELECT id FROM calepinage_layouts WHERE project_id = ? LIMIT 1
    `).bind(projectId).first()
    
    let layoutId: number
    
    if (existing) {
      // UPDATE
      const layoutData = JSON.stringify(layout)
      const result = await DB.prepare(`
        UPDATE calepinage_layouts
        SET 
          module_type = ?,
          layout_name = ?,
          layout_data = ?,
          view_box_json = ?,
          modules_json = ?,
          arrows_json = ?,
          zones_json = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ?
      `).bind(
        moduleType,
        layoutName,
        layoutData,
        JSON.stringify(layout.viewBox),
        JSON.stringify(layout.modules),
        JSON.stringify(layout.arrows),
        JSON.stringify(layout.zones),
        projectId
      ).run()
      
      layoutId = existing.id as number
    } else {
      // INSERT
      const layoutData = JSON.stringify(layout)
      const result = await DB.prepare(`
        INSERT INTO calepinage_layouts (
          project_id,
          module_type,
          layout_name,
          layout_data,
          view_box_json,
          modules_json,
          arrows_json,
          zones_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        projectId,
        moduleType,
        layoutName,
        layoutData,
        JSON.stringify(layout.viewBox),
        JSON.stringify(layout.modules),
        JSON.stringify(layout.arrows),
        JSON.stringify(layout.zones)
      ).run()
      
      layoutId = result.meta.last_row_id as number
    }
    
    const response: SaveLayoutResponse = {
      success: true,
      layoutId,
      message: existing ? 'Layout mis à jour' : 'Layout créé'
    }
    
    return c.json(response)
  } catch (error: any) {
    console.error('Erreur sauvegarde layout:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================================================
// DELETE /api/calepinage/layouts/:projectId - Supprimer layout
// ============================================================================
apiLayoutsRouter.delete('/:projectId', async (c) => {
  const { DB } = c.env
  const { projectId } = c.req.param()
  
  try {
    await DB.prepare(`
      DELETE FROM calepinage_layouts WHERE project_id = ?
    `).bind(projectId).run()
    
    return c.json({ success: true, message: 'Layout supprimé' })
  } catch (error: any) {
    console.error('Erreur suppression layout:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default apiLayoutsRouter
