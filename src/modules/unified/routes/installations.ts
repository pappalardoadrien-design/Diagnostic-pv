// ============================================================================
// UNIFIED MODULE - INSTALLATIONS ROUTES
// API unifiée pour lister toutes les installations (audits EL + centrales PV)
// ============================================================================

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const installationsRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/unified/installations - Liste TOUTES les installations
// Combine audits EL + centrales PV dans une liste unifiée
// ============================================================================
installationsRouter.get('/', async (c) => {
  const { DB } = c.env
  
  try {
    // 1. Récupérer audits EL
    const elAudits = await DB.prepare(`
      SELECT 
        'el' as type,
        id,
        audit_token as identifier,
        project_name as name,
        client_name,
        location,
        total_modules,
        string_count,
        modules_per_string,
        status,
        completion_rate as progress,
        created_at,
        updated_at
      FROM el_audits
      ORDER BY created_at DESC
    `).all()
    
    // 2. Récupérer centrales PV
    const pvPlants = await DB.prepare(`
      SELECT 
        'pv' as type,
        p.id,
        p.plant_name as name,
        p.address,
        p.city,
        p.postal_code,
        p.country,
        p.total_power_kwp,
        p.notes,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT z.id) as zone_count,
        COUNT(m.id) as total_modules,
        SUM(m.power_wp) as total_power_wp
      FROM pv_plants p
      LEFT JOIN pv_zones z ON p.id = z.plant_id
      LEFT JOIN pv_modules m ON z.id = m.zone_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all()
    
    // 3. Formater et unifier les résultats
    const elInstallations = (elAudits.results || []).map((audit: any) => ({
      type: 'el',
      id: audit.id,
      identifier: audit.identifier,
      name: audit.name,
      client: audit.client_name,
      location: audit.location,
      modules_count: audit.total_modules,
      config: `${audit.string_count}×${audit.modules_per_string}`,
      status: audit.status,
      progress: Math.round(audit.progress || 0),
      created_at: audit.created_at,
      badge: 'MODULE EL',
      badge_color: 'green',
      url: `/audit/${audit.identifier}`
    }))
    
    const pvInstallations = (pvPlants.results || []).map((plant: any) => ({
      type: 'pv',
      id: plant.id,
      identifier: `PV-${plant.id}`,
      name: plant.name,
      client: null, // PV plants n'ont pas de champ client
      location: plant.city ? `${plant.city}, ${plant.country || 'France'}` : plant.address,
      modules_count: plant.total_modules || 0,
      zone_count: plant.zone_count || 0,
      power_kwc: plant.total_power_kwc,
      status: 'active',
      created_at: plant.created_at,
      badge: 'PV CARTO',
      badge_color: 'purple',
      url: `/pv/plant/${plant.id}`
    }))
    
    // 4. Combiner et trier par date
    const allInstallations = [
      ...elInstallations,
      ...pvInstallations
    ].sort((a, b) => {
      const dateA = new Date(a.created_at || 0)
      const dateB = new Date(b.created_at || 0)
      return dateB.getTime() - dateA.getTime()
    })
    
    // 5. Statistiques globales
    const stats = {
      total: allInstallations.length,
      el_audits: elInstallations.length,
      pv_plants: pvInstallations.length,
      total_modules: allInstallations.reduce((sum, inst) => sum + (inst.modules_count || 0), 0)
    }
    
    return c.json({
      success: true,
      installations: allInstallations,
      stats,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Erreur récupération installations:', error)
    return c.json({ 
      error: 'Erreur récupération installations',
      details: error.message 
    }, 500)
  }
})

// ============================================================================
// GET /api/unified/installations/search?q=... - Recherche installations
// ============================================================================
installationsRouter.get('/search', async (c) => {
  const { DB } = c.env
  const query = c.req.query('q') || ''
  
  if (!query || query.length < 2) {
    return c.json({ 
      success: false,
      error: 'Query trop courte (minimum 2 caractères)' 
    }, 400)
  }
  
  try {
    const searchPattern = `%${query}%`
    
    // Recherche dans audits EL
    const elResults = await DB.prepare(`
      SELECT 
        'el' as type,
        id,
        audit_token as identifier,
        project_name as name,
        client_name,
        location
      FROM el_audits
      WHERE project_name LIKE ? 
         OR client_name LIKE ?
         OR location LIKE ?
         OR audit_token LIKE ?
      LIMIT 10
    `).bind(searchPattern, searchPattern, searchPattern, searchPattern).all()
    
    // Recherche dans centrales PV
    const pvResults = await DB.prepare(`
      SELECT 
        'pv' as type,
        id,
        plant_name as name,
        address,
        city
      FROM pv_plants
      WHERE plant_name LIKE ?
         OR address LIKE ?
         OR city LIKE ?
      LIMIT 10
    `).bind(searchPattern, searchPattern, searchPattern).all()
    
    const results = [
      ...(elResults.results || []),
      ...(pvResults.results || [])
    ]
    
    return c.json({
      success: true,
      results,
      count: results.length,
      query
    })
    
  } catch (error: any) {
    console.error('Erreur recherche:', error)
    return c.json({ 
      error: 'Erreur recherche',
      details: error.message 
    }, 500)
  }
})

export default installationsRouter
