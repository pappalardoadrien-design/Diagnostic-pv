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
// ============================================================================
dashboardRouter.get('/audits', async (c) => {
  const { env } = c
  
  try {
    // Utilisation de la vue précalculée pour performances optimales
    const audits = await env.DB.prepare(`
      SELECT * FROM v_el_audit_statistics
      ORDER BY created_at DESC
    `).all()
    
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
