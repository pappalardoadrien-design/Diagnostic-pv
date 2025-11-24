// ============================================================================
// MODULE EL - ROUTES DASHBOARD
// ============================================================================
// Dashboard avec statistiques globales tous audits EL
// Utilise la vue v_el_audit_statistics pour performances optimales

import { Hono } from 'hono'
import type { ELAuditStatistics } from '../types'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const dashboardRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/el/dashboard/audits - Liste tous les audits avec statistiques
// Supporte filtre ?intervention_id=X pour retrouver audits liés à une intervention
// ============================================================================
dashboardRouter.get('/audits', async (c) => {
  const { env } = c
  const interventionId = c.req.query('intervention_id')
  
  try {
    let query = `
      SELECT 
        a.audit_token,
        a.project_name,
        a.client_name,
        a.location,
        a.status,
        a.created_at,
        a.intervention_id,
        ea.string_count,
        ea.total_modules,
        COUNT(em.id) as modules_completed,
        SUM(CASE WHEN em.defect_type = 'ok' THEN 1 ELSE 0 END) as modules_ok,
        SUM(CASE WHEN em.defect_type = 'microcracks' THEN 1 ELSE 0 END) as modules_microcrack,
        SUM(CASE WHEN em.defect_type = 'dead_cell' THEN 1 ELSE 0 END) as modules_dead,
        SUM(CASE WHEN em.defect_type = 'inequality' OR em.defect_type = 'pid' THEN 1 ELSE 0 END) as modules_inequality,
        SUM(CASE WHEN em.severity_level = 'critical' THEN 1 ELSE 0 END) as modules_critical,
        ROUND((COUNT(CASE WHEN em.defect_type != 'pending' THEN 1 END) * 100.0 / NULLIF(ea.total_modules, 0)), 1) as completion_rate
      FROM audits a
      LEFT JOIN el_audits ea ON ea.audit_token = a.audit_token
      LEFT JOIN el_modules em ON em.audit_token = a.audit_token
    `
    
    // Filtre par intervention_id si fourni
    if (interventionId) {
      query += ` WHERE a.intervention_id = ?`
    }
    
    query += ` GROUP BY a.audit_token, a.id
               ORDER BY a.created_at DESC`
    
    const statement = interventionId 
      ? env.DB.prepare(query).bind(parseInt(interventionId))
      : env.DB.prepare(query)
    
    const audits = await statement.all()
    
    // Calcul statistiques globales
    let totalAudits = 0
    let activeAudits = 0
    let totalModules = 0
    let totalDefauts = 0
    
    const auditsWithStats = audits.results.map((audit: any) => {
      totalAudits++
      if (audit.status === 'created' || audit.status === 'in_progress') {
        activeAudits++
      }
      totalModules += audit.total_modules || 0
      
      const defauts = (audit.modules_inequality || 0) + 
                     (audit.modules_microcrack || 0) + 
                     (audit.modules_dead || 0)
      totalDefauts += defauts
      
      const progressionPct = audit.total_modules > 0 
        ? Math.round((audit.completion_rate || 0))
        : 0
        
      return {
        ...audit,
        defauts_total: defauts,
        progression_pct: progressionPct,
        created_at_formatted: new Date(audit.created_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    })
    
    return c.json({ 
      success: true,
      audits: auditsWithStats,
      stats: {
        totalAudits,
        activeAudits,
        totalModules,
        totalDefauts
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Erreur récupération dashboard:', error)
    return c.json({ error: 'Erreur récupération dashboard' }, 500)
  }
})

// ============================================================================
// GET /api/el/dashboard/overview - Vue d'ensemble globale (intégration future avec autres modules)
// ============================================================================
dashboardRouter.get('/overview', async (c) => {
  const { env } = c
  
  try {
    // Statistiques Module EL uniquement pour l'instant
    const elStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_audits,
        SUM(total_modules) as total_modules,
        SUM(modules_ok) as total_ok,
        SUM(modules_microcrack) as total_microcrack,
        SUM(modules_dead) as total_dead,
        SUM(modules_inequality) as total_inequality,
        SUM(modules_critical) as total_critical
      FROM v_el_audit_statistics
    `).first()
    
    // TODO: Ajouter statistiques des autres modules (I-V, Thermique, etc.) quand disponibles
    
    return c.json({
      success: true,
      el_module: elStats,
      // iv_module: {}, // À implémenter
      // thermique_module: {}, // À implémenter
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Erreur récupération overview:', error)
    return c.json({ error: 'Erreur récupération overview' }, 500)
  }
})

export default dashboardRouter
