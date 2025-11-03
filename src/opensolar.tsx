import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Types Cloudflare
type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS
app.use('/*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  credentials: true
}))

// ============================================================================
// MODULE OPENSOLAR DXF IMPORT - ISOLATED MODULE
// ============================================================================
// 
// Ce module est COMPLÈTEMENT ISOLÉ du Canvas V2 pour éviter tout bug
// Une fois validé, il sera intégré dans index.tsx
//
// WORKFLOW:
// 1. Upload fichier DXF OpenSolar
// 2. Parser DXF → extraire layer "PANELS" (coordonnées rectangles modules)
// 3. Convertir coordonnées relatives DXF → GPS absolues
// 4. Générer module_identifier (S1-P01, S1-P02, etc.)
// 5. Sauvegarder dans pv_modules table
// 6. Visualiser sur Leaflet map
//
// ============================================================================

/**
 * POST /parse-dxf
 * 
 * Parse fichier DXF et extraire modules
 * 
 * Body: { dxfContent: string, zoneId: number }
 * Returns: { modules: Array<Module>, facets: Array<Polygon>, stats: Object }
 */
app.post('/parse-dxf', async (c) => {
  try {
    const { dxfContent, zoneId } = await c.req.json()
    
    if (!dxfContent || !zoneId) {
      return c.json({ 
        error: 'dxfContent et zoneId requis' 
      }, 400)
    }

    // Parser DXF avec dxf-parser
    const DxfParser = require('dxf-parser')
    const parser = new DxfParser()
    let dxf
    
    try {
      dxf = parser.parseSync(dxfContent)
      console.log('✅ DXF parsed successfully')
      console.log('📊 Layers disponibles:', Object.keys(dxf.tables.layer.layers))
    } catch (parseError) {
      throw new Error('Parsing DXF échoué: ' + parseError.message)
    }
    
    // Rechercher layer PANELS (OpenSolar utilise ce nom pour les modules)
    const panelsLayer = dxf.tables.layer.layers['PANELS'] || 
                        dxf.tables.layer.layers['Panels'] ||
                        dxf.tables.layer.layers['panels']
    
    if (!panelsLayer) {
      console.warn('⚠️ Layer PANELS non trouvé, layers disponibles:', Object.keys(dxf.tables.layer.layers))
    }
    
    // Extraire entités du layer PANELS
    const panelEntities = dxf.entities.filter(e => 
      e.layer === 'PANELS' || e.layer === 'Panels' || e.layer === 'panels'
    )
    
    console.log('📦 Entités PANELS trouvées:', panelEntities.length)
    
    // Extraire rectangles modules (LWPOLYLINE ou INSERT blocks)
    const moduleRectangles = []
    
    for (const entity of panelEntities) {
      if (entity.type === 'LWPOLYLINE') {
        // Rectangle défini par 4 vertices
        const vertices = entity.vertices
        if (vertices && vertices.length >= 4) {
          // Calculer centre du rectangle
          const centerX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length
          const centerY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length
          
          moduleRectangles.push({
            centerX,
            centerY,
            width: Math.abs(vertices[1].x - vertices[0].x),
            height: Math.abs(vertices[2].y - vertices[1].y),
            type: 'polyline'
          })
        }
      } else if (entity.type === 'INSERT') {
        // Bloc inséré (OpenSolar peut utiliser des blocks pour les modules)
        moduleRectangles.push({
          centerX: entity.position.x,
          centerY: entity.position.y,
          width: 1.7,  // dimensions standard module
          height: 1.0,
          type: 'block',
          blockName: entity.name
        })
      }
    }
    
    console.log('🔲 Rectangles modules extraits:', moduleRectangles.length)
    
    // Si aucun module trouvé, retourner données mock pour debug
    if (moduleRectangles.length === 0) {
      console.warn('⚠️ Aucun module détecté dans le DXF, génération données mock')
    }
    
    // Récupérer zone de référence pour conversion GPS
    const { env } = c
    const zone = await env.DB.prepare(
      'SELECT * FROM pv_zones WHERE id = ?'
    ).bind(zoneId).first()

    if (!zone) {
      return c.json({ error: 'Zone non trouvée' }, 404)
    }
    
    // Coordonnées GPS de référence (coin nord-ouest de la zone)
    const refLat = parseFloat(zone.polygon_latitude)
    const refLng = parseFloat(zone.polygon_longitude)
    
    console.log('📍 Référence GPS:', refLat, refLng)
    
    // Convertir rectangles DXF → modules avec GPS
    const extractedModules = []
    
    if (moduleRectangles.length > 0) {
      // Déterminer configuration strings automatiquement
      // Trier par Y (nord-sud) puis par X (ouest-est)
      moduleRectangles.sort((a, b) => {
        const yDiff = b.centerY - a.centerY  // du nord au sud
        if (Math.abs(yDiff) > 0.5) return yDiff > 0 ? 1 : -1
        return a.centerX - b.centerX  // d'ouest en est
      })
      
      let stringNum = 1
      let posInString = 1
      
      for (let i = 0; i < moduleRectangles.length; i++) {
        const rect = moduleRectangles[i]
        
        // Conversion DXF (mètres) → GPS (degrés)
        // 1 degré latitude ≈ 111320m
        // 1 degré longitude ≈ 111320m * cos(latitude)
        const latOffset = rect.centerY / 111320
        const lngOffset = rect.centerX / (111320 * Math.cos(refLat * Math.PI / 180))
        
        const moduleLat = refLat + latOffset
        const moduleLng = refLng + lngOffset
        
        extractedModules.push({
          module_identifier: 'S' + stringNum + '-P' + String(posInString).padStart(2, '0'),
          latitude: moduleLat,
          longitude: moduleLng,
          string_number: stringNum,
          position_in_string: posInString,
          width_meters: rect.width || 1.7,
          height_meters: rect.height || 1.0,
          rotation: 0,
          power_wp: 450,
          module_status: 'pending'
        })
        
        posInString++
        
        // Nouvelle string tous les 24 modules (configurable)
        if (posInString > 24) {
          stringNum++
          posInString = 1
        }
      }
      
      console.log('✅ Modules convertis:', extractedModules.length)
    }
    
    // Si aucun module extrait, utiliser MOCK DATA pour développement
    const mockModules = extractedModules.length > 0 ? extractedModules : [
      {
        module_identifier: 'S1-P01',
        latitude: parseFloat(zone.polygon_latitude) + 0.0001,
        longitude: parseFloat(zone.polygon_longitude) + 0.0001,
        string_number: 1,
        position_in_string: 1,
        width_meters: 1.7,
        height_meters: 1.0,
        rotation: 0,
        power_wp: 450,
        module_status: 'pending'
      },
      {
        module_identifier: 'S1-P02',
        latitude: parseFloat(zone.polygon_latitude) + 0.0001,
        longitude: parseFloat(zone.polygon_longitude) + 0.0002,
        string_number: 1,
        position_in_string: 2,
        width_meters: 1.7,
        height_meters: 1.0,
        rotation: 0,
        power_wp: 450,
        module_status: 'pending'
      }
    ]

    // Calculer stats
    const finalModules = extractedModules.length > 0 ? extractedModules : mockModules
    const uniqueStrings = [...new Set(finalModules.map(m => m.string_number))].length
    const totalPower = finalModules.reduce((sum, m) => sum + m.power_wp, 0)
    
    return c.json({
      success: true,
      modules: finalModules,
      stats: {
        totalModules: finalModules.length,
        strings: uniqueStrings,
        totalPower: totalPower
      },
      debug: {
        dxfLayers: dxf ? Object.keys(dxf.tables.layer.layers) : [],
        panelEntitiesFound: panelEntities.length,
        rectanglesExtracted: moduleRectangles.length,
        usedMockData: extractedModules.length === 0
      }
    })

  } catch (error) {
    console.error('Erreur parse DXF:', error)
    return c.json({ 
      error: 'Erreur parsing DXF: ' + error.message 
    }, 500)
  }
})

/**
 * POST /import-modules
 * 
 * Importer modules extraits du DXF dans la base de données
 * 
 * Body: { zoneId: number, modules: Array<Module> }
 * Returns: { success: boolean, insertedCount: number }
 */
app.post('/import-modules', async (c) => {
  try {
    const { zoneId, modules } = await c.req.json()
    const { env } = c

    if (!zoneId || !modules || modules.length === 0) {
      return c.json({ 
        error: 'zoneId et modules requis' 
      }, 400)
    }

    // Vérifier que la zone existe
    const zone = await env.DB.prepare(
      'SELECT id FROM pv_zones WHERE id = ?'
    ).bind(zoneId).first()

    if (!zone) {
      return c.json({ error: 'Zone non trouvée' }, 404)
    }

    // Supprimer anciens modules de cette zone (cleanup)
    await env.DB.prepare(
      'DELETE FROM pv_modules WHERE zone_id = ?'
    ).bind(zoneId).run()

    // Insérer nouveaux modules
    let insertedCount = 0
    for (const module of modules) {
      await env.DB.prepare(`
        INSERT INTO pv_modules (
          zone_id, module_identifier, latitude, longitude,
          string_number, position_in_string, width_meters, height_meters,
          rotation, power_wp, module_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        zoneId,
        module.module_identifier,
        module.latitude,
        module.longitude,
        module.string_number,
        module.position_in_string,
        module.width_meters || 1.7,
        module.height_meters || 1.0,
        module.rotation || 0,
        module.power_wp || 450,
        module.module_status || 'pending'
      ).run()
      
      insertedCount++
    }

    return c.json({
      success: true,
      insertedCount: insertedCount
    })

  } catch (error) {
    console.error('Erreur import modules:', error)
    return c.json({ 
      error: 'Erreur import: ' + error.message 
    }, 500)
  }
})

/**
 * GET /test
 * 
 * Route de test pour vérifier que le module est bien monté
 */
app.get('/test', (c) => {
  return c.json({
    message: 'Module OpenSolar DXF opérationnel ✅',
    version: '1.0.0',
    endpoints: [
      'POST /api/opensolar/parse-dxf',
      'POST /api/opensolar/import-modules',
      'GET /api/opensolar/test'
    ]
  })
})

export default app
