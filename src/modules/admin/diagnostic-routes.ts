/**
 * Diagnostic Routes - Routes de diagnostic systeme
 * Extrait de index.tsx le 2026-02-20 (refactoring)
 * 
 * Routes:
 * - GET /api/diagnostic/interconnect
 */

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const diagnosticRoutes = new Hono<{ Bindings: Bindings }>()

// GET /api/diagnostic/health - Health check
diagnosticRoutes.get('/health', async (c) => {
  try {
    const { DB } = c.env
    const check = await DB.prepare("SELECT 1 as ok").first() as any
    return c.json({
      status: 'ok',
      database: check?.ok === 1 ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    })
  } catch (error: any) {
    return c.json({ status: 'error', database: 'disconnected', error: error.message }, 500)
  }
})

diagnosticRoutes.get('/interconnect', async (c) => {
  const { DB } = c.env
  
  try {
    // 1. Stats CRM
    const clients = await DB.prepare("SELECT COUNT(*) as count FROM crm_clients").first() as any
    
    // 2. Stats PV Plants avec liaison client
    const plants = await DB.prepare(`
      SELECT p.id, p.plant_name, p.client_id, c.company_name as client_name,
             (SELECT COUNT(*) FROM pv_zones WHERE plant_id = p.id) as zone_count,
             (SELECT COUNT(*) FROM pv_modules m JOIN pv_zones z ON m.zone_id = z.id WHERE z.plant_id = p.id) as module_count
      FROM pv_plants p
      LEFT JOIN crm_clients c ON p.client_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all() as any
    
    // 3. Stats Audits EL
    const audits = await DB.prepare(`
      SELECT COUNT(*) as count FROM el_audits
    `).first() as any
    
    // 4. Liaisons EL ↔ PV existantes
    const links = await DB.prepare(`
      SELECT COUNT(*) as count FROM pv_cartography_audit_links
    `).first() as any
    
    // 5. KPIs globaux
    const kpis = {
      clients_total: clients?.count || 0,
      plants_total: plants?.results?.length || 0,
      plants_linked_to_client: plants?.results?.filter((p: any) => p.client_id !== null).length || 0,
      audits_total: audits?.count || 0,
      el_pv_links: links?.count || 0
    }
    
    return c.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis,
      plants: plants?.results || [],
      interconnection_status: {
        crm_pv: kpis.plants_linked_to_client > 0 ? '✅ Actif' : '⚠️ Partiel',
        pv_el: kpis.el_pv_links > 0 ? '✅ Actif' : '⚠️ Non lié (utiliser Editor V2 > Sync EL)',
        summary: `${kpis.plants_linked_to_client}/${kpis.plants_total} centrales liées à un client`
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})


export default diagnosticRoutes
