/**
 * GIRASOLE MODULE - API Routes
 * 
 * Mission: 52 centrales PV (39 SOL + 13 DOUBLE)
 * Checklists: CONFORMITE (NF C 15-100) + TOITURE (DTU 40.35)
 * 
 * Endpoints:
 * - GET /stats - Statistiques centrales
 * - GET /projects - Liste centrales paginée
 * - GET /project/:id - Détails centrale
 * - POST /inspection/create - Créer inspection + items checklist
 * - GET /inspection/:token - Récupérer inspection
 * - PUT /inspection/:token/item/:itemCode - Mettre à jour item
 * - GET /inspection/:token/report - Générer rapport PDF
 * - POST /inspection/:token/photos - Upload photos
 * - GET /export/annexe2 - Export CSV ANNEXE 2
 */

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const girasoleRoutes = new Hono<{ Bindings: Bindings }>()

// =============================================================================
// 1. STATISTIQUES DASHBOARD
// =============================================================================
girasoleRoutes.get('/stats', async (c) => {
  const { DB } = c.env

  try {
    // Count total, SOL, DOUBLE, completed, pending
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN audit_types LIKE '%TOITURE%' THEN 1 ELSE 0 END) as double,
        SUM(CASE WHEN audit_types NOT LIKE '%TOITURE%' THEN 1 ELSE 0 END) as sol,
        0 as completed,
        COUNT(*) as pending
      FROM projects 
      WHERE is_girasole = 1
    `).first()

    return c.json(stats || { total: 0, sol: 0, double: 0, completed: 0, pending: 0 })
  } catch (error) {
    console.error('Error fetching GIRASOLE stats:', error)
    return c.json({ error: 'Failed to fetch stats' }, 500)
  }
})

// =============================================================================
// 2. LISTE DES CENTRALES (PAGINÉE)
// =============================================================================
girasoleRoutes.get('/projects', async (c) => {
  const { DB } = c.env
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '52')
  const filter = c.req.query('filter') || 'all' // all, sol, double
  const search = c.req.query('search') || ''

  try {
    let whereClause = 'WHERE is_girasole = 1'
    
    if (filter === 'sol') {
      whereClause += ` AND audit_types NOT LIKE '%TOITURE%'`
    } else if (filter === 'double') {
      whereClause += ` AND audit_types LIKE '%TOITURE%'`
    }

    if (search) {
      whereClause += ` AND (name LIKE ? OR site_address LIKE ? OR id_referent LIKE ?)`
    }

    const offset = (page - 1) * limit

    const query = search 
      ? DB.prepare(`
          SELECT * FROM projects 
          ${whereClause}
          ORDER BY id_referent ASC
          LIMIT ? OFFSET ?
        `).bind(`%${search}%`, `%${search}%`, `%${search}%`, limit, offset)
      : DB.prepare(`
          SELECT * FROM projects 
          ${whereClause}
          ORDER BY id_referent ASC
          LIMIT ? OFFSET ?
        `).bind(limit, offset)

    const { results } = await query.all()

    return c.json({ 
      projects: results,
      page,
      limit,
      total: results?.length || 0
    })
  } catch (error) {
    console.error('Error fetching GIRASOLE projects:', error)
    return c.json({ error: 'Failed to fetch projects' }, 500)
  }
})

// =============================================================================
// 3. DÉTAILS D'UNE CENTRALE
// =============================================================================
girasoleRoutes.get('/project/:id', async (c) => {
  const { DB } = c.env
  const projectId = parseInt(c.req.param('id'))

  try {
    const project = await DB.prepare(`
      SELECT * FROM projects 
      WHERE id = ? AND is_girasole = 1
    `).bind(projectId).first()

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    return c.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return c.json({ error: 'Failed to fetch project' }, 500)
  }
})

// =============================================================================
// 4. CRÉER INSPECTION + GÉNÉRER CHECKLIST ITEMS
// =============================================================================
girasoleRoutes.post('/inspection/create', async (c) => {
  const { DB } = c.env
  const { project_id, checklist_type } = await c.req.json()

  if (!project_id || !checklist_type) {
    return c.json({ error: 'project_id and checklist_type required' }, 400)
  }

  if (!['CONFORMITE', 'TOITURE'].includes(checklist_type)) {
    return c.json({ error: 'checklist_type must be CONFORMITE or TOITURE' }, 400)
  }

  try {
    // Check if inspection already exists
    const existing = await DB.prepare(`
      SELECT audit_token, COUNT(*) as items_count
      FROM visual_inspections
      WHERE project_id = ? AND checklist_type = ?
      GROUP BY audit_token
      LIMIT 1
    `).bind(project_id, checklist_type).first()

    if (existing) {
      return c.json({
        inspection: {
          token: existing.audit_token,
          exists: true,
          items_count: existing.items_count
        }
      })
    }

    // Generate new token
    const token = `GIRASOLE-${checklist_type}-${project_id}-${Date.now()}`

    // Generate checklist items based on type
    const items = checklist_type === 'CONFORMITE' 
      ? CHECKLIST_CONFORMITE_ITEMS
      : CHECKLIST_TOITURE_ITEMS

    // Insert all items
    const insertPromises = items.map((item, index) => {
      return DB.prepare(`
        INSERT INTO visual_inspections (
          project_id, checklist_type, audit_token,
          inspection_type, notes, item_order, audit_category, checklist_section
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        project_id,
        checklist_type,
        token,
        item.code,
        JSON.stringify({
          description: item.description,
          category: item.category,
          subcategory: item.subcategory,
          normReference: item.normReference,
          criticalityLevel: item.criticalityLevel,
          checkMethod: item.checkMethod
        }),
        index,
        item.category,
        item.subcategory
      ).run()
    })

    await Promise.all(insertPromises)

    return c.json({
      inspection: {
        token,
        items_count: items.length,
        checklist_type
      }
    })
  } catch (error) {
    console.error('Error creating inspection:', error)
    return c.json({ error: 'Failed to create inspection' }, 500)
  }
})

// =============================================================================
// 5. RÉCUPÉRER INSPECTION
// =============================================================================
girasoleRoutes.get('/inspection/:token', async (c) => {
  const { DB } = c.env
  const token = c.req.param('token')

  try {
    const { results } = await DB.prepare(`
      SELECT * FROM visual_inspections
      WHERE audit_token = ?
      ORDER BY item_order ASC
    `).bind(token).all()

    if (!results || results.length === 0) {
      return c.json({ error: 'Inspection not found' }, 404)
    }

    return c.json({ 
      inspection: {
        token,
        checklist_type: results[0].checklist_type,
        project_id: results[0].project_id,
        items: results.map(item => ({
          id: item.id,
          code: item.inspection_type,
          conformity: item.conformite,
          observation: item.notes ? JSON.parse(item.notes) : null,
          metadata: item.notes ? JSON.parse(item.notes) : {}
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching inspection:', error)
    return c.json({ error: 'Failed to fetch inspection' }, 500)
  }
})

// =============================================================================
// 6. METTRE À JOUR UN ITEM DE CHECKLIST
// =============================================================================
girasoleRoutes.put('/inspection/:token/item/:itemCode', async (c) => {
  const { DB } = c.env
  const token = c.req.param('token')
  const itemCode = c.req.param('itemCode')
  const { conformity, observation } = await c.req.json()

  if (!['conforme', 'non_conforme', 'sans_objet', 'non_verifie'].includes(conformity)) {
    return c.json({ error: 'Invalid conformity value' }, 400)
  }

  try {
    await DB.prepare(`
      UPDATE visual_inspections
      SET conformite = ?, notes = ?
      WHERE audit_token = ? AND inspection_type = ?
    `).bind(conformity, observation || '', token, itemCode).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating item:', error)
    return c.json({ error: 'Failed to update item' }, 500)
  }
})

// =============================================================================
// 7. GÉNÉRER RAPPORT PDF
// =============================================================================
girasoleRoutes.get('/inspection/:token/report', async (c) => {
  const { DB } = c.env
  const token = c.req.param('token')
  const checklistType = c.req.query('type') || 'CONFORMITE' // Default to CONFORMITE if not specified

  try {
    // Get inspection with items, filtering by checklist_type
    const { results: items } = await DB.prepare(`
      SELECT * FROM visual_inspections
      WHERE audit_token = ? AND checklist_type = ?
      ORDER BY item_order ASC
    `).bind(token, checklistType).all()

    if (!items || items.length === 0) {
      return c.html('<h1>Inspection non trouvée</h1>', 404)
    }

    const projectId = items[0].project_id

    // Get project details
    const project = await DB.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(projectId).first()

    if (!project) {
      return c.html('<h1>Projet non trouvé</h1>', 404)
    }

    // Parse items with metadata
    const parsedItems = items.map((item: any) => {
      let metadata = {}
      try {
        metadata = item.notes ? JSON.parse(item.notes) : {}
      } catch (e) {
        console.error('Failed to parse notes:', e)
      }

      return {
        code: item.inspection_type,
        category: item.audit_category || metadata.category || '',
        subcategory: item.checklist_section || metadata.subcategory || '',
        description: metadata.description || '',
        normReference: metadata.normReference || '',
        criticalityLevel: metadata.criticalityLevel || 'minor',
        checkMethod: metadata.checkMethod || '',
        conformity: item.conformite || 'non_verifie',
        observation: metadata.observation || ''
      }
    })

    // Calculate stats
    const stats = {
      total: items.length,
      conformes: items.filter((i: any) => i.conformite === 'conforme').length,
      non_conformes: items.filter((i: any) => i.conformite === 'non_conforme').length,
      sans_objet: items.filter((i: any) => i.conformite === 'sans_objet').length,
      non_verifies: items.filter((i: any) => !i.conformite || i.conformite === 'non_verifie').length,
      taux_conformite: 0
    }

    const total = stats.conformes + stats.non_conformes
    stats.taux_conformite = total > 0 ? Math.round((stats.conformes / total) * 100) : 0

    // Generate report based on checklist type
    if (checklistType === 'CONFORMITE') {
      console.log('✅ GENERATING CONFORMITE REPORT - MINIMALISTE VERSION')
      
      // Group items by category
      const categories: Record<string, typeof parsedItems> = {}
      parsedItems.forEach(item => {
        if (!categories[item.category]) categories[item.category] = []
        categories[item.category].push(item)
      })

      const catNames: Record<string, string> = {
        'PROTECTIONS': 'Protections Électriques',
        'MISE_A_TERRE': 'Mise à la Terre',
        'CABLAGE': 'Câblage',
        'EQUIPEMENTS': 'Équipements',
        'SIGNALISATION': 'Signalisation'
      }

      let itemsHtml = ''
      Object.keys(catNames).forEach(catKey => {
        const catItems = categories[catKey] || []
        if (catItems.length === 0) return
        
        itemsHtml += `<h3>${catNames[catKey]}</h3><table>`
        catItems.forEach(item => {
          const status = item.conformity || 'non_verifie'
          itemsHtml += `<tr><td><b>${item.code}</b></td><td>${item.description}</td><td class="${status}">${status === 'conforme' ? '✅' : status === 'non_conforme' ? '❌' : status === 'sans_objet' ? 'S.O.' : '⏳'}</td></tr>`
        })
        itemsHtml += `</table>`
      })

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Rapport GIRASOLE - ${project.name}</title><style>@page{size:A4;margin:15mm}body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;background:#fff}.header{border-bottom:3px solid #16a34a;padding-bottom:15px;margin-bottom:25px}.header h1{color:#16a34a;font-size:24px;margin:0}.header p{font-size:11px;color:#666;margin:5px 0}.info{background:#f0fdf4;border-left:4px solid #16a34a;padding:15px;margin:20px 0}table{width:100%;border-collapse:collapse;margin:15px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f1f5f9;font-weight:600}.conforme{color:#16a34a}.non_conforme{color:#dc2626}.sans_objet{color:#94a3b8}.non_verifie{color:#f59e0b}h3{background:#1e293b;color:#fff;padding:10px;margin:20px 0 10px;font-size:14px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:20px 0}.stat{background:#f8fafc;border:2px solid #e5e7eb;padding:15px;text-align:center;border-radius:6px}.stat .num{font-size:28px;font-weight:700;color:#16a34a}.footer{margin-top:40px;padding-top:20px;border-top:2px solid #e5e7eb;font-size:10px;color:#64748b}button{background:#16a34a;color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;position:fixed;top:20px;right:20px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">📄 Imprimer</button><div class="header"><h1>🔋 DiagPV</h1><p><strong>Diagnostic Photovoltaïque</strong> | 3 rue d'Apollo, 31240 L'Union | 05.81.10.16.59 | contact@diagpv.fr | RCS 792972309</p><h2 style="color:#16a34a;margin-top:15px">RAPPORT D'AUDIT DE CONFORMITÉ ÉLECTRIQUE</h2><p style="font-size:13px;color:#64748b">Installation Photovoltaïque - Norme NF C 15-100</p></div><div class="info"><strong>Centrale :</strong> ${project.name}<br><strong>ID Référent :</strong> ${project.id_referent}<br><strong>Adresse :</strong> ${project.site_address}<br><strong>Puissance :</strong> ${project.installation_power} kWc</div><div class="stats"><div class="stat"><div class="num" style="color:#16a34a">${stats.conformes}</div><div>Conformes</div></div><div class="stat"><div class="num" style="color:#dc2626">${stats.non_conformes}</div><div>Non Conformes</div></div><div class="stat"><div class="num" style="color:#94a3b8">${stats.sans_objet}</div><div>Sans Objet</div></div><div class="stat"><div class="num" style="color:#16a34a">${stats.taux_conformite}%</div><div>Taux Conformité</div></div></div>${itemsHtml}<div class="footer"><p><strong>Auditeur DiagPV :</strong> Fabien CORRERA, Expert Photovoltaïque</p><p style="margin-top:10px"><strong>Disclaimer :</strong> Ce rapport présente l'état de l'installation au moment de l'audit. DiagPV SAS (RCS 792972309) est un organisme d'expertise indépendant.</p></div></body></html>`
      
      return c.html(html)
    } else if (checklistType === 'TOITURE') {
      console.log('✅ GENERATING TOITURE REPORT - MINIMALISTE VERSION')
      
      const categories: Record<string, typeof parsedItems> = {}
      parsedItems.forEach(item => {
        if (!categories[item.category]) categories[item.category] = []
        categories[item.category].push(item)
      })

      const catNames: Record<string, string> = {
        'ETANCHEITE': 'Étanchéité',
        'FIXATIONS': 'Fixations',
        'STRUCTURE': 'Structure',
        'EVACUATION': 'Évacuation EP',
        'SECURITE': 'Sécurité'
      }

      let itemsHtml = ''
      Object.keys(catNames).forEach(catKey => {
        const catItems = categories[catKey] || []
        if (catItems.length === 0) return
        
        itemsHtml += `<h3>${catNames[catKey]}</h3><table>`
        catItems.forEach(item => {
          const status = item.conformity || 'non_verifie'
          itemsHtml += `<tr><td><b>${item.code}</b></td><td>${item.description}</td><td class="${status}">${status === 'conforme' ? '✅' : status === 'non_conforme' ? '❌' : status === 'sans_objet' ? 'S.O.' : '⏳'}</td></tr>`
        })
        itemsHtml += `</table>`
      })

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Rapport GIRASOLE Toiture - ${project.name}</title><style>@page{size:A4;margin:15mm}body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;background:#fff}.header{border-bottom:3px solid #16a34a;padding-bottom:15px;margin-bottom:25px}.header h1{color:#16a34a;font-size:24px;margin:0}.header p{font-size:11px;color:#666;margin:5px 0}.info{background:#f0fdf4;border-left:4px solid #16a34a;padding:15px;margin:20px 0}table{width:100%;border-collapse:collapse;margin:15px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f1f5f9;font-weight:600}.conforme{color:#16a34a}.non_conforme{color:#dc2626}.sans_objet{color:#94a3b8}.non_verifie{color:#f59e0b}h3{background:#1e293b;color:#fff;padding:10px;margin:20px 0 10px;font-size:14px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:20px 0}.stat{background:#f8fafc;border:2px solid #e5e7eb;padding:15px;text-align:center;border-radius:6px}.stat .num{font-size:28px;font-weight:700;color:#16a34a}.footer{margin-top:40px;padding-top:20px;border-top:2px solid #e5e7eb;font-size:10px;color:#64748b}button{background:#16a34a;color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;position:fixed;top:20px;right:20px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">📄 Imprimer</button><div class="header"><h1>🔋 DiagPV</h1><p><strong>Diagnostic Photovoltaïque</strong> | 3 rue d'Apollo, 31240 L'Union | 05.81.10.16.59 | contact@diagpv.fr | RCS 792972309</p><h2 style="color:#16a34a;margin-top:15px">RAPPORT D'AUDIT DE CONFORMITÉ TOITURE</h2><p style="font-size:13px;color:#64748b">Installation Photovoltaïque - Norme DTU 40.35</p></div><div class="info"><strong>Centrale :</strong> ${project.name}<br><strong>ID Référent :</strong> ${project.id_referent}<br><strong>Adresse :</strong> ${project.site_address}<br><strong>Puissance :</strong> ${project.installation_power} kWc</div><div class="stats"><div class="stat"><div class="num" style="color:#16a34a">${stats.conformes}</div><div>Conformes</div></div><div class="stat"><div class="num" style="color:#dc2626">${stats.non_conformes}</div><div>Non Conformes</div></div><div class="stat"><div class="num" style="color:#94a3b8">${stats.sans_objet}</div><div>Sans Objet</div></div><div class="stat"><div class="num" style="color:#16a34a">${stats.taux_conformite}%</div><div>Taux Conformité</div></div></div>${itemsHtml}<div class="footer"><p><strong>Auditeur DiagPV :</strong> Fabien CORRERA, Expert Photovoltaïque</p><p style="margin-top:10px"><strong>Disclaimer :</strong> Ce rapport présente l'état de l'installation au moment de l'audit. DiagPV SAS (RCS 792972309) est un organisme d'expertise indépendant.</p></div></body></html>`
      
      return c.html(html)
    } else {
      return c.html('<h1>Type de checklist non supporté</h1>', 400)
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return c.html(`<h1>Erreur génération rapport</h1><p>${error}</p>`, 500)
  }
})

// =============================================================================
// 7B. GÉNÉRER RAPPORT PDF - TEST ROUTE
// =============================================================================
girasoleRoutes.get('/report-test/:token', async (c) => {
  return c.html(`
    <html>
      <body>
        <h1 style="color: red;">TEST ROUTE WORKS!</h1>
        <p>Token: ${c.req.param('token')}</p>
      </body>
    </html>
  `)
})

// =============================================================================
// 8. EXPORT ANNEXE 2 CSV
// =============================================================================
girasoleRoutes.get('/export/annexe2', async (c) => {
  const { DB } = c.env

  try {
    // Fetch all GIRASOLE projects
    const { results: projects } = await DB.prepare(`
      SELECT 
        id, name, id_referent, site_address,
        installation_power, audit_types
      FROM projects
      WHERE is_girasole = 1
      ORDER BY id_referent ASC
    `).all()

    if (!projects || projects.length === 0) {
      return c.json({ error: 'No GIRASOLE projects found' }, 404)
    }

    // For each project, get inspection stats
    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
        const { results: inspections } = await DB.prepare(`
          SELECT 
            audit_token,
            conformite
          FROM visual_inspections
          WHERE project_id = ?
        `).bind(p.id).all()

        const tokens = new Set((inspections || []).map((i: any) => i.audit_token).filter(Boolean))
        const conformes = (inspections || []).filter((i: any) => i.conformite === 'conforme').length
        const non_conformes = (inspections || []).filter((i: any) => i.conformite === 'non_conforme').length

        return {
          ...p,
          inspections_count: tokens.size,
          conformes,
          non_conformes
        }
      })
    )

    // Generate CSV
    const headers = [
      'ID Référent',
      'Nom Centrale',
      'Adresse',
      'Puissance (kWc)',
      'Type Audit',
      'Statut',
      'Inspections',
      'Conformes',
      'Non Conformes',
      'Taux Conformité (%)',
      'Date Dernière Visite',
      'Commentaires',
      'URL Rapport'
    ]

    const rows = projectsWithStats.map(p => {
      const auditTypes = JSON.parse(p.audit_types || '[]')
      const totalItems = p.conformes + p.non_conformes
      const tauxConformite = totalItems > 0 ? ((p.conformes / totalItems) * 100).toFixed(1) : '0'
      const statut = p.inspections_count > 0 ? 'En cours' : 'À planifier'

      return [
        p.id_referent || '',
        p.name || '',
        p.site_address || '',
        p.installation_power || '',
        auditTypes.join(' + '),
        statut,
        p.inspections_count || 0,
        p.conformes || 0,
        p.non_conformes || 0,
        tauxConformite,
        '', // Date dernière visite
        '', // Commentaires
        '' // URL rapport
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    }) || []

    const csv = [headers.join(','), ...rows].join('\n')

    return c.text(csv, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ANNEXE_2_GIRASOLE_52_centrales.csv"'
    })
  } catch (error) {
    console.error('Error exporting ANNEXE 2:', error)
    return c.json({ error: 'Failed to export ANNEXE 2' }, 500)
  }
})

// =============================================================================
// 8. EXPORT EXCEL ANNEXE 2 DÉTAILLÉ (47 COLONNES)
// =============================================================================
girasoleRoutes.get('/export/annexe2-excel/:audit_token?', async (c) => {
  const { DB } = c.env
  const auditToken = c.req.param('audit_token') // Optionnel : exporter un seul audit ou tous

  try {
    // Fetch inspections with full details
    let query = `
      SELECT 
        vi.id,
        vi.project_id,
        vi.audit_token,
        vi.checklist_type,
        vi.inspection_type,
        vi.notes,
        vi.item_order,
        vi.audit_category,
        vi.checklist_section,
        vi.conformite,
        vi.created_at,
        p.name as project_name,
        p.id_referent,
        p.site_address,
        p.installation_power,
        p.audit_types,
        a.client_name,
        a.location,
        a.status as audit_status
      FROM visual_inspections vi
      LEFT JOIN projects p ON vi.project_id = p.id
      LEFT JOIN audits a ON vi.audit_token = a.audit_token
      WHERE p.is_girasole = 1
    `
    
    if (auditToken) {
      query += ` AND vi.audit_token = ?`
    }
    
    query += ` ORDER BY p.id_referent ASC, vi.checklist_type ASC, vi.item_order ASC`

    const { results: inspections } = auditToken 
      ? await DB.prepare(query).bind(auditToken).all()
      : await DB.prepare(query).all()

    if (!inspections || inspections.length === 0) {
      return c.json({ error: 'No inspections found' }, 404)
    }

    // Parse notes JSON for each inspection
    const parsedInspections = inspections.map((item: any) => {
      let metadata = {}
      try {
        metadata = item.notes ? JSON.parse(item.notes) : {}
      } catch (e) {
        console.error('Failed to parse notes:', e)
      }
      return { ...item, metadata }
    })

    // Generate Excel XML (SpreadsheetML format)
    const headers = [
      'ID Référent', 'Nom Centrale', 'Adresse', 'Puissance kWc', 'Type Audit',
      'Token Audit', 'Statut Audit', 'Date Inspection', 'Type Checklist',
      'Code Item', 'Ordre', 'Catégorie', 'Section', 'Description', 
      'Référence Normative', 'Méthode Contrôle', 'Niveau Criticité',
      'Conformité', 'Observation', 'Photos URLs', 'Température', 'Humidité',
      'Conditions Météo', 'Latitude', 'Longitude', 'Altitude', 'Précision GPS',
      'Défauts Détectés', 'Sévérité', 'Action Corrective', 'Priorité',
      'Coût Estimé', 'Délai Correction', 'Responsable', 'Statut Correction',
      'Date Correction', 'Preuve Correction', 'Commentaire Auditeur',
      'Validé Par', 'Date Validation', 'Version Rapport', 'URL Rapport',
      'Client', 'Nom Auditeur', 'Contact Client', 'Email Client',
      'Téléphone Client', 'Garantie', 'Date Mise Service'
    ]

    let rows = parsedInspections.map((item: any) => {
      const meta = item.metadata || {}
      const auditTypes = JSON.parse(item.audit_types || '[]')
      
      return [
        item.id_referent || '',
        item.project_name || '',
        item.site_address || '',
        item.installation_power || '',
        auditTypes.join(' + '),
        item.audit_token || '',
        item.audit_status || 'pending',
        item.created_at || '',
        item.checklist_type || '',
        meta.code || item.inspection_type || '',
        item.item_order || 0,
        item.audit_category || '',
        item.checklist_section || '',
        meta.description || '',
        meta.normReference || '',
        meta.checkMethod || '',
        meta.criticalityLevel || 'minor',
        item.conformite || 'non_verifie',
        meta.observation || '',
        meta.photos ? JSON.stringify(meta.photos) : '',
        meta.temperature || '',
        meta.humidity || '',
        meta.weather || '',
        meta.latitude || '',
        meta.longitude || '',
        meta.altitude || '',
        meta.gps_accuracy || '',
        meta.defects || '',
        meta.severity || '',
        meta.corrective_action || '',
        meta.priority || '',
        meta.estimated_cost || '',
        meta.correction_deadline || '',
        meta.responsible || '',
        meta.correction_status || '',
        meta.correction_date || '',
        meta.correction_proof || '',
        meta.auditor_comment || '',
        meta.validated_by || '',
        meta.validation_date || '',
        meta.report_version || 'v1.0',
        '', // URL rapport (à compléter)
        item.client_name || '',
        '', // Nom auditeur
        '', // Contact client
        '', // Email client
        '', // Téléphone client
        '', // Garantie
        '' // Date mise service
      ]
    })

    // Build Excel XML
    const xmlRows = rows.map(row => {
      const cells = row.map(cell => {
        const escaped = String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        return `<Cell><Data ss:Type="String">${escaped}</Data></Cell>`
      }).join('')
      return `<Row>${cells}</Row>`
    }).join('')

    const headerCells = headers.map(h => 
      `<Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`
    ).join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
  <Style ss:ID="Header">
    <Font ss:Bold="1"/>
    <Interior ss:Color="#16a34a" ss:Pattern="Solid"/>
  </Style>
</Styles>
<Worksheet ss:Name="ANNEXE 2">
  <Table>
    <Row>${headerCells}</Row>
    ${xmlRows}
  </Table>
</Worksheet>
</Workbook>`

    return c.body(xml, 200, {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="ANNEXE_2_GIRASOLE_${auditToken || 'COMPLET'}_${new Date().toISOString().split('T')[0]}.xls"`
    })
  } catch (error) {
    console.error('Error exporting ANNEXE 2 Excel:', error)
    return c.json({ error: 'Failed to export ANNEXE 2 Excel', details: error }, 500)
  }
})

// =============================================================================
// CHECKLIST ITEMS DEFINITIONS
// =============================================================================

interface ChecklistItem {
  code: string
  category: string
  subcategory: string
  description: string
  normReference: string
  criticalityLevel: 'critical' | 'major' | 'minor' | 'info'
  checkMethod: string
}

const CHECKLIST_CONFORMITE_ITEMS: ChecklistItem[] = [
  // PROTECTIONS (5 items)
  {
    code: 'CONF-01',
    category: 'PROTECTIONS',
    subcategory: 'Protection différentielle',
    description: 'Vérifier présence et fonctionnement du dispositif différentiel 30mA',
    normReference: 'NF C 15-100 Section 531.2',
    criticalityLevel: 'critical',
    checkMethod: 'Test du bouton test + mesure déclenchement'
  },
  {
    code: 'CONF-02',
    category: 'PROTECTIONS',
    subcategory: 'Protection surintensité',
    description: 'Vérifier calibre et type des disjoncteurs/fusibles',
    normReference: 'NF C 15-100 Section 533',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + vérification schéma unifilaire'
  },
  {
    code: 'CONF-03',
    category: 'PROTECTIONS',
    subcategory: 'Sectionneur DC',
    description: 'Présence et accessibilité du sectionneur côté DC',
    normReference: 'NF C 15-100 Section 712.537.2.1.6',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + manoeuvre'
  },
  {
    code: 'CONF-04',
    category: 'PROTECTIONS',
    subcategory: 'Protection foudre',
    description: 'Présence parafoudre DC et AC (si requis)',
    normReference: 'NF C 15-100 Section 443',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + état voyants'
  },
  {
    code: 'CONF-05',
    category: 'PROTECTIONS',
    subcategory: 'Dispositif coupure urgence',
    description: 'Accessibilité et signalisation du dispositif de coupure d\'urgence',
    normReference: 'NF C 15-100 Section 712.537.2.1.6',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + accessibilité'
  },

  // MISE À LA TERRE (3 items)
  {
    code: 'CONF-06',
    category: 'MISE_A_TERRE',
    subcategory: 'Liaison équipotentielle',
    description: 'Vérifier continuité liaison équipotentielle structures métalliques',
    normReference: 'NF C 15-100 Section 712.411.3.1.2',
    criticalityLevel: 'critical',
    checkMethod: 'Mesure continuité électrique < 0.1 Ω'
  },
  {
    code: 'CONF-07',
    category: 'MISE_A_TERRE',
    subcategory: 'Prise de terre',
    description: 'Mesure résistance de terre',
    normReference: 'NF C 15-100 Section 542.2',
    criticalityLevel: 'critical',
    checkMethod: 'Mesure tellurique (< 100 Ω recommandé)'
  },
  {
    code: 'CONF-08',
    category: 'MISE_A_TERRE',
    subcategory: 'Conducteurs de protection',
    description: 'Section et couleur des conducteurs de protection (PE)',
    normReference: 'NF C 15-100 Section 543',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + mesure section'
  },

  // CÂBLAGE (5 items)
  {
    code: 'CONF-09',
    category: 'CABLAGE',
    subcategory: 'Câbles DC',
    description: 'Type, section et protection des câbles DC',
    normReference: 'NF C 15-100 Section 521',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + vérification marquage'
  },
  {
    code: 'CONF-10',
    category: 'CABLAGE',
    subcategory: 'Câbles AC',
    description: 'Type, section et protection des câbles AC',
    normReference: 'NF C 15-100 Section 521',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + vérification schéma'
  },
  {
    code: 'CONF-11',
    category: 'CABLAGE',
    subcategory: 'Cheminement câbles',
    description: 'Protection mécanique et séparation DC/AC',
    normReference: 'NF C 15-100 Section 528',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel parcours complet'
  },
  {
    code: 'CONF-12',
    category: 'CABLAGE',
    subcategory: 'Connecteurs',
    description: 'Conformité et serrage connecteurs MC4/H4',
    normReference: 'IEC 62852',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + test traction'
  },
  {
    code: 'CONF-13',
    category: 'CABLAGE',
    subcategory: 'Étanchéité',
    description: 'Étanchéité traversées de paroi et presse-étoupes',
    normReference: 'NF C 15-100 Section 522',
    criticalityLevel: 'minor',
    checkMethod: 'Contrôle visuel + test manuel'
  },

  // ÉQUIPEMENTS (4 items)
  {
    code: 'CONF-14',
    category: 'EQUIPEMENTS',
    subcategory: 'Onduleur',
    description: 'Installation et ventilation onduleur',
    normReference: 'Notice fabricant',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + espaces dégagement'
  },
  {
    code: 'CONF-15',
    category: 'EQUIPEMENTS',
    subcategory: 'Coffrets électriques',
    description: 'Conformité et indice de protection coffrets (IP)',
    normReference: 'NF C 15-100 Section 512.2',
    criticalityLevel: 'major',
    checkMethod: 'Vérification marquage + état général'
  },
  {
    code: 'CONF-16',
    category: 'EQUIPEMENTS',
    subcategory: 'Compteur production',
    description: 'Installation et raccordement compteur',
    normReference: 'C13-200 Enedis',
    criticalityLevel: 'minor',
    checkMethod: 'Contrôle visuel + fonctionnement'
  },
  {
    code: 'CONF-17',
    category: 'EQUIPEMENTS',
    subcategory: 'Boîtes de jonction',
    description: 'Étanchéité et serrage boîtes de jonction strings',
    normReference: 'IEC 60529',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + IP65 minimum'
  },

  // SIGNALISATION (3 items)
  {
    code: 'CONF-18',
    category: 'SIGNALISATION',
    subcategory: 'Étiquetage',
    description: 'Présence étiquettes réglementaires (DC, tension, consignes)',
    normReference: 'UTE C 15-712-1 Section 10.3',
    criticalityLevel: 'minor',
    checkMethod: 'Contrôle visuel exhaustif'
  },
  {
    code: 'CONF-19',
    category: 'SIGNALISATION',
    subcategory: 'Schémas',
    description: 'Disponibilité schéma unifilaire et plan implantation',
    normReference: 'NF C 15-100 Section 514.5',
    criticalityLevel: 'minor',
    checkMethod: 'Vérification présence documents'
  },
  {
    code: 'CONF-20',
    category: 'SIGNALISATION',
    subcategory: 'Consignes sécurité',
    description: 'Affichage consignes exploitation et intervention',
    normReference: 'UTE C 15-712-1',
    criticalityLevel: 'minor',
    checkMethod: 'Contrôle visuel + lisibilité'
  }
]

const CHECKLIST_TOITURE_ITEMS: ChecklistItem[] = [
  // ÉTANCHÉITÉ (4 items)
  {
    code: 'TOIT-01',
    category: 'ETANCHEITE',
    subcategory: 'Membrane',
    description: 'État général de la membrane d\'étanchéité',
    normReference: 'DTU 40.35 Section 5.1',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection visuelle complète'
  },
  {
    code: 'TOIT-02',
    category: 'ETANCHEITE',
    subcategory: 'Traversées',
    description: 'Étanchéité traversées de toiture (câbles, fixations)',
    normReference: 'DTU 40.35 Section 5.3',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + test manuel'
  },
  {
    code: 'TOIT-03',
    category: 'ETANCHEITE',
    subcategory: 'Relevés',
    description: 'Conformité hauteur et état des relevés d\'étanchéité',
    normReference: 'DTU 40.35 Section 5.2',
    criticalityLevel: 'major',
    checkMethod: 'Mesure hauteur (≥15cm) + contrôle visuel'
  },
  {
    code: 'TOIT-04',
    category: 'ETANCHEITE',
    subcategory: 'Joints',
    description: 'État joints et soudures membrane',
    normReference: 'DTU 40.35 Section 6',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + test traction légère'
  },

  // FIXATIONS (3 items)
  {
    code: 'TOIT-05',
    category: 'FIXATIONS',
    subcategory: 'Système fixation',
    description: 'Conformité système de fixation (lest ou ancré)',
    normReference: 'DTU 40.35 Section 7',
    criticalityLevel: 'critical',
    checkMethod: 'Vérification calcul charges + Avis Technique'
  },
  {
    code: 'TOIT-06',
    category: 'FIXATIONS',
    subcategory: 'Ancrages',
    description: 'État et serrage des ancrages en toiture',
    normReference: 'DTU 43.1',
    criticalityLevel: 'major',
    checkMethod: 'Test serrage + contrôle visuel corrosion'
  },
  {
    code: 'TOIT-07',
    category: 'FIXATIONS',
    subcategory: 'Protection anticorrosion',
    description: 'Protection anticorrosion fixations métalliques',
    normReference: 'NF EN 1090',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel (galvanisation, peinture)'
  },

  // STRUCTURE (3 items)
  {
    code: 'TOIT-08',
    category: 'STRUCTURE',
    subcategory: 'Charpente',
    description: 'Absence de déformation/fléchissement charpente',
    normReference: 'DTU 31.2 ou 32.1',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + mesure nivellement si doute'
  },
  {
    code: 'TOIT-09',
    category: 'STRUCTURE',
    subcategory: 'Surcharges',
    description: 'Respect charges admissibles toiture',
    normReference: 'Eurocode 1 - NF EN 1991',
    criticalityLevel: 'critical',
    checkMethod: 'Vérification note de calcul structure'
  },
  {
    code: 'TOIT-10',
    category: 'STRUCTURE',
    subcategory: 'Espacement supports',
    description: 'Respect espacement règlementaire entre supports',
    normReference: 'Avis Technique système',
    criticalityLevel: 'major',
    checkMethod: 'Mesure entraxes + comparaison AT'
  },

  // ÉVACUATION (3 items)
  {
    code: 'TOIT-11',
    category: 'EVACUATION',
    subcategory: 'Pente toiture',
    description: 'Pente suffisante pour évacuation eaux pluviales',
    normReference: 'DTU 40.35 Section 4',
    criticalityLevel: 'major',
    checkMethod: 'Mesure pente (≥3% recommandé)'
  },
  {
    code: 'TOIT-12',
    category: 'EVACUATION',
    subcategory: 'Évacuations EP',
    description: 'État et accessibilité évacuations eaux pluviales',
    normReference: 'DTU 60.11',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel + test écoulement'
  },
  {
    code: 'TOIT-13',
    category: 'EVACUATION',
    subcategory: 'Stagnation eau',
    description: 'Absence de zones de stagnation d\'eau',
    normReference: 'DTU 40.35',
    criticalityLevel: 'major',
    checkMethod: 'Contrôle visuel après pluie'
  },

  // SÉCURITÉ (2 items)
  {
    code: 'TOIT-14',
    category: 'SECURITE',
    subcategory: 'Accès toiture',
    description: 'Sécurisation accès toiture (garde-corps, échelles)',
    normReference: 'Code du Travail R4224-1',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + conformité équipements'
  },
  {
    code: 'TOIT-15',
    category: 'SECURITE',
    subcategory: 'Lignes de vie',
    description: 'Présence et état lignes de vie / points d\'ancrage EPI',
    normReference: 'NF EN 795',
    criticalityLevel: 'critical',
    checkMethod: 'Contrôle visuel + vérification certificats'
  }
]

// =============================================================================
// 9. GÉNÉRATION BATCH RAPPORTS PDF (52 CENTRALES)
// =============================================================================
girasoleRoutes.post('/batch/generate-reports', async (c) => {
  const { DB } = c.env

  try {
    // Get all GIRASOLE projects with inspections
    const { results: projects } = await DB.prepare(`
      SELECT DISTINCT
        p.id,
        p.name,
        p.id_referent,
        p.site_address,
        p.installation_power,
        p.audit_types,
        vi.audit_token,
        vi.checklist_type
      FROM projects p
      INNER JOIN visual_inspections vi ON p.id = vi.project_id
      WHERE p.is_girasole = 1
      ORDER BY p.id_referent ASC
    `).all()

    if (!projects || projects.length === 0) {
      return c.json({ error: 'No GIRASOLE projects with inspections found' }, 404)
    }

    // Group by audit_token and checklist_type to generate unique reports
    const reportsToGenerate: Array<{
      audit_token: string
      checklist_type: string
      project_name: string
      id_referent: string
    }> = []

    const seen = new Set<string>()
    for (const p of projects) {
      const key = `${p.audit_token}-${p.checklist_type}`
      if (!seen.has(key) && p.audit_token && p.checklist_type) {
        seen.add(key)
        reportsToGenerate.push({
          audit_token: p.audit_token,
          checklist_type: p.checklist_type,
          project_name: p.name,
          id_referent: p.id_referent
        })
      }
    }

    console.log(`📊 Batch generation: ${reportsToGenerate.length} reports to generate`)

    // Generate report URLs
    const baseUrl = new URL(c.req.url).origin
    const reportUrls = reportsToGenerate.map(r => ({
      project: `${r.id_referent} - ${r.project_name}`,
      checklist_type: r.checklist_type,
      audit_token: r.audit_token,
      report_url: `${baseUrl}/api/girasole/inspection/${r.audit_token}/report?type=${r.checklist_type}`,
      filename: `GIRASOLE_${r.id_referent}_${r.checklist_type}_${r.audit_token.split('-').pop()}.pdf`
    }))

    // Return manifest JSON with all report URLs
    return c.json({
      success: true,
      total_reports: reportUrls.length,
      generated_at: new Date().toISOString(),
      reports: reportUrls,
      instructions: {
        message: 'Use the report_url to download individual PDF reports',
        batch_download: 'You can use a download manager to download all reports automatically',
        example_curl: `curl -O "${reportUrls[0]?.report_url}" # Download first report`
      }
    })
  } catch (error) {
    console.error('Error generating batch reports:', error)
    return c.json({ error: 'Failed to generate batch reports', details: error }, 500)
  }
})

// =============================================================================
// 10. GÉNÉRATION ZIP ARCHIVE RAPPORTS (OPTIMISÉ)
// =============================================================================
girasoleRoutes.get('/batch/download-all-reports', async (c) => {
  const { DB } = c.env

  try {
    // Get unique audit tokens with checklist types
    const { results: inspections } = await DB.prepare(`
      SELECT DISTINCT
        vi.audit_token,
        vi.checklist_type,
        p.name,
        p.id_referent
      FROM visual_inspections vi
      INNER JOIN projects p ON vi.project_id = p.id
      WHERE p.is_girasole = 1
      ORDER BY p.id_referent ASC
    `).all()

    if (!inspections || inspections.length === 0) {
      return c.json({ error: 'No inspections found' }, 404)
    }

    // Generate list of report URLs
    const baseUrl = new URL(c.req.url).origin
    const reportsList = inspections.map((insp: any) => {
      const filename = `GIRASOLE_${insp.id_referent}_${insp.checklist_type}_${insp.audit_token.split('-').pop()}.html`
      return {
        filename,
        url: `${baseUrl}/api/girasole/inspection/${insp.audit_token}/report?type=${insp.checklist_type}`,
        project: insp.name,
        type: insp.checklist_type
      }
    })

    // Return HTML page with download links
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GIRASOLE - Téléchargement Batch Rapports</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
  <div class="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-green-600 mb-2">🔋 DiagPV - GIRASOLE</h1>
      <p class="text-gray-600">Téléchargement Batch - ${reportsList.length} Rapports Disponibles</p>
    </div>

    <div class="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4">
      <p class="font-semibold text-blue-800">💡 Instructions:</p>
      <ul class="list-disc list-inside text-blue-700 mt-2 space-y-1">
        <li>Cliquez sur chaque lien pour télécharger individuellement</li>
        <li>Ou utilisez "Télécharger Tout" pour sauvegarder tous les rapports</li>
        <li>Les rapports sont au format HTML imprimable (Ctrl+P pour PDF)</li>
      </ul>
    </div>

    <button onclick="downloadAll()" class="mb-6 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
      📥 Télécharger Tout (${reportsList.length} rapports)
    </button>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-200">
            <th class="border p-3 text-left">ID Ref</th>
            <th class="border p-3 text-left">Centrale</th>
            <th class="border p-3 text-left">Type</th>
            <th class="border p-3 text-left">Fichier</th>
            <th class="border p-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          ${reportsList.map((r: any) => `
            <tr class="hover:bg-gray-50">
              <td class="border p-3">${r.filename.split('_')[1]}</td>
              <td class="border p-3">${r.project}</td>
              <td class="border p-3">
                <span class="px-2 py-1 rounded text-xs font-semibold ${r.type === 'CONFORMITE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
                  ${r.type}
                </span>
              </td>
              <td class="border p-3 font-mono text-sm">${r.filename}</td>
              <td class="border p-3 text-center">
                <a href="${r.url}" target="_blank" class="text-green-600 hover:text-green-800 font-semibold">
                  📄 Voir/Télécharger
                </a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="mt-8 text-sm text-gray-500 border-t pt-4">
      <p><strong>DiagPV - Diagnostic Photovoltaïque</strong></p>
      <p>3 rue d'Apollo, 31240 L'Union | 05.81.10.16.59 | contact@diagpv.fr | RCS 792972309</p>
    </div>
  </div>

  <script>
    const reports = ${JSON.stringify(reportsList)};
    
    async function downloadAll() {
      const btn = event.target;
      btn.disabled = true;
      btn.textContent = '⏳ Téléchargement en cours...';
      
      for (let i = 0; i < reports.length; i++) {
        const report = reports[i];
        try {
          const response = await fetch(report.url);
          const html = await response.text();
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = report.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // Update progress
          btn.textContent = \`📥 \${i + 1}/\${reports.length} téléchargés...\`;
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Error downloading ' + report.filename, error);
        }
      }
      
      btn.disabled = false;
      btn.textContent = '✅ Téléchargement terminé !';
      setTimeout(() => {
        btn.textContent = '📥 Télécharger Tout (' + reports.length + ' rapports)';
      }, 3000);
    }
  </script>
</body>
</html>`

    return c.html(html)
  } catch (error) {
    console.error('Error generating download page:', error)
    return c.json({ error: 'Failed to generate download page', details: error }, 500)
  }
})

// =============================================================================
// 11. RAPPORT SYNTHÈSE GÉNÉRAL CLIENT (52 CENTRALES)
// =============================================================================
girasoleRoutes.get('/synthesis-report/client/:clientId?', async (c) => {
  const { DB } = c.env
  const clientId = c.req.param('clientId') || '1' // Default: GIRASOLE Energies

  try {
    // Get all GIRASOLE projects stats
    const { results: projects } = await DB.prepare(`
      SELECT 
        p.id,
        p.name,
        p.id_referent,
        p.site_address,
        p.installation_power,
        p.audit_types,
        COUNT(DISTINCT vi.audit_token) as audits_count,
        SUM(CASE WHEN vi.conformite = 'conforme' THEN 1 ELSE 0 END) as conformes,
        SUM(CASE WHEN vi.conformite = 'non_conforme' THEN 1 ELSE 0 END) as non_conformes,
        SUM(CASE WHEN vi.conformite = 'sans_objet' THEN 1 ELSE 0 END) as sans_objet
      FROM projects p
      LEFT JOIN visual_inspections vi ON p.id = vi.project_id
      WHERE p.is_girasole = 1
      GROUP BY p.id
      ORDER BY p.id_referent ASC
    `).all()

    // Calculate global stats
    const totalProjects = projects?.length || 0
    const solProjects = projects?.filter((p: any) => !JSON.parse(p.audit_types || '[]').includes('TOITURE')).length || 0
    const doubleProjects = projects?.filter((p: any) => JSON.parse(p.audit_types || '[]').includes('TOITURE')).length || 0
    
    let totalConformes = 0
    let totalNonConformes = 0
    let totalItems = 0
    let completedProjects = 0
    
    projects?.forEach((p: any) => {
      totalConformes += p.conformes || 0
      totalNonConformes += p.non_conformes || 0
      totalItems += (p.conformes || 0) + (p.non_conformes || 0)
      if ((p.audits_count || 0) > 0) completedProjects++
    })

    const globalConformityRate = totalItems > 0 ? ((totalConformes / totalItems) * 100).toFixed(1) : '0'
    const completionRate = totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) : '0'

    // Get top anomalies by category
    const { results: topAnomalies } = await DB.prepare(`
      SELECT 
        audit_category,
        checklist_section,
        COUNT(*) as count
      FROM visual_inspections
      WHERE conformite = 'non_conforme'
        AND project_id IN (SELECT id FROM projects WHERE is_girasole = 1)
      GROUP BY audit_category, checklist_section
      ORDER BY count DESC
      LIMIT 10
    `).all()

    // Generate HTML synthesis report
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GIRASOLE - Rapport Synthèse Général</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-50">
  <div class="max-w-7xl mx-auto p-8">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-4xl font-bold text-green-600">🔋 DiagPV - GIRASOLE</h1>
          <p class="text-gray-600 mt-2">Rapport de Synthèse Général - Mission 52 Centrales Photovoltaïques</p>
        </div>
        <button onclick="window.print()" class="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
          📄 Imprimer
        </button>
      </div>
      <div class="grid grid-cols-4 gap-4 mt-6">
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-3xl font-bold text-blue-600">${totalProjects}</div>
          <div class="text-sm text-gray-600">Centrales Total</div>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-3xl font-bold text-green-600">${solProjects}</div>
          <div class="text-sm text-gray-600">SOL (CONFORMITE)</div>
        </div>
        <div class="text-center p-4 bg-purple-50 rounded-lg">
          <div class="text-3xl font-bold text-purple-600">${doubleProjects}</div>
          <div class="text-sm text-gray-600">DOUBLE (CONF+TOIT)</div>
        </div>
        <div class="text-center p-4 bg-yellow-50 rounded-lg">
          <div class="text-3xl font-bold text-yellow-600">${completionRate}%</div>
          <div class="text-sm text-gray-600">Progression</div>
        </div>
      </div>
    </div>

    <!-- Global Stats -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">📊 Statistiques Globales</h2>
        <div class="space-y-3">
          <div class="flex justify-between items-center p-3 bg-green-50 rounded">
            <span class="font-semibold text-green-800">Items Conformes</span>
            <span class="text-2xl font-bold text-green-600">${totalConformes}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-red-50 rounded">
            <span class="font-semibold text-red-800">Items Non Conformes</span>
            <span class="text-2xl font-bold text-red-600">${totalNonConformes}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-blue-50 rounded">
            <span class="font-semibold text-blue-800">Taux Conformité Global</span>
            <span class="text-2xl font-bold text-blue-600">${globalConformityRate}%</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">🎯 Mission GIRASOLE</h2>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between p-2 border-b">
            <span class="text-gray-600">Budget Total</span>
            <span class="font-bold">66.885 € HT</span>
          </div>
          <div class="flex justify-between p-2 border-b">
            <span class="text-gray-600">Période</span>
            <span class="font-bold">Janvier - Mars 2025</span>
          </div>
          <div class="flex justify-between p-2 border-b">
            <span class="text-gray-600">Centrales complétées</span>
            <span class="font-bold">${completedProjects} / ${totalProjects}</span>
          </div>
          <div class="flex justify-between p-2 border-b">
            <span class="text-gray-600">Coût moyen/centrale</span>
            <span class="font-bold">${(66885 / totalProjects).toFixed(0)} € HT</span>
          </div>
          <div class="flex justify-between p-2">
            <span class="text-gray-600">Restant à facturer</span>
            <span class="font-bold text-orange-600">${(66885 * (1 - completedProjects / totalProjects)).toFixed(0)} € HT</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Anomalies -->
    <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">⚠️ Top 10 Anomalies Détectées</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-100 border-b">
              <th class="p-3 text-left">#</th>
              <th class="p-3 text-left">Catégorie</th>
              <th class="p-3 text-left">Section</th>
              <th class="p-3 text-center">Occurrences</th>
              <th class="p-3 text-center">Criticité</th>
            </tr>
          </thead>
          <tbody>
            ${(topAnomalies || []).map((a: any, i: number) => `
              <tr class="border-b hover:bg-gray-50">
                <td class="p-3 font-bold text-gray-500">${i + 1}</td>
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                    ${a.audit_category || 'N/A'}
                  </span>
                </td>
                <td class="p-3">${a.checklist_section || 'N/A'}</td>
                <td class="p-3 text-center">
                  <span class="text-lg font-bold text-red-600">${a.count}</span>
                </td>
                <td class="p-3 text-center">
                  <span class="px-3 py-1 rounded-full text-xs font-semibold ${a.count >= 5 ? 'bg-red-500 text-white' : a.count >= 3 ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-white'}">
                    ${a.count >= 5 ? 'CRITIQUE' : a.count >= 3 ? 'MAJEURE' : 'MINEURE'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Projects List -->
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">🏢 Liste Centrales (${totalProjects})</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-100 border-b">
              <th class="p-2 text-left">ID Ref</th>
              <th class="p-2 text-left">Centrale</th>
              <th class="p-2 text-center">Type Audit</th>
              <th class="p-2 text-center">Puissance</th>
              <th class="p-2 text-center">Conformes</th>
              <th class="p-2 text-center">Non Conformes</th>
              <th class="p-2 text-center">Taux</th>
              <th class="p-2 text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${(projects || []).map((p: any) => {
              const auditTypes = JSON.parse(p.audit_types || '[]')
              const total = (p.conformes || 0) + (p.non_conformes || 0)
              const rate = total > 0 ? ((p.conformes / total) * 100).toFixed(0) : '0'
              const status = (p.audits_count || 0) > 0 ? 'Complété' : 'Pending'
              
              return `
                <tr class="border-b hover:bg-gray-50">
                  <td class="p-2 font-mono">${p.id_referent || 'N/A'}</td>
                  <td class="p-2 font-semibold">${p.name}</td>
                  <td class="p-2 text-center">
                    <span class="px-2 py-1 rounded text-xs font-semibold ${auditTypes.includes('TOITURE') ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                      ${auditTypes.join(' + ')}
                    </span>
                  </td>
                  <td class="p-2 text-center">${p.installation_power || 0} kWc</td>
                  <td class="p-2 text-center text-green-600 font-bold">${p.conformes || 0}</td>
                  <td class="p-2 text-center text-red-600 font-bold">${p.non_conformes || 0}</td>
                  <td class="p-2 text-center">
                    <span class="font-bold ${rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-600'}">${rate}%</span>
                  </td>
                  <td class="p-2 text-center">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${status === 'Complété' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                      ${status}
                    </span>
                  </td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-8 text-center text-sm text-gray-500">
      <p><strong>DiagPV - Diagnostic Photovoltaïque</strong></p>
      <p>3 rue d'Apollo, 31240 L'Union | 05.81.10.16.59 | contact@diagpv.fr | RCS 792972309</p>
      <p class="mt-2">Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    </div>
  </div>

  <style>
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      button { display: none !important; }
    }
  </style>
</body>
</html>`

    return c.html(html)
  } catch (error) {
    console.error('Error generating synthesis report:', error)
    return c.json({ error: 'Failed to generate synthesis report', details: error }, 500)
  }
})

// =============================================================================
// 12. IMPORT PLANIFICATEUR CSV GIRASOLE (BATCH PROJECTS)
// =============================================================================
girasoleRoutes.post('/import/planning-csv', async (c) => {
  const { DB } = c.env

  try {
    const body = await c.req.json()
    const { csv_data, client_id } = body

    if (!csv_data) {
      return c.json({ error: 'csv_data is required' }, 400)
    }

    // Parse CSV (simple implementation)
    const lines = csv_data.trim().split('\n')
    if (lines.length < 2) {
      return c.json({ error: 'CSV must contain header + at least 1 data row' }, 400)
    }

    const headers = lines[0].split(',').map((h: string) => h.trim())
    const expectedHeaders = ['id_referent', 'nom_centrale', 'adresse', 'puissance_kwc', 'type_audit', 'date_planifiee', 'commentaires']
    
    // Validate headers
    const hasRequiredHeaders = expectedHeaders.every(h => headers.includes(h))
    if (!hasRequiredHeaders) {
      return c.json({ 
        error: 'Invalid CSV headers', 
        expected: expectedHeaders, 
        received: headers 
      }, 400)
    }

    // Parse rows
    const projects = []
    const errors = []

    // Simple CSV parser that handles quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = parseCSVLine(line)
      
      if (values.length !== headers.length) {
        errors.push({ row: i + 1, error: 'Column count mismatch', line })
        continue
      }

      const project: any = {}
      headers.forEach((h, idx) => {
        project[h] = values[idx]
      })

      // Validate required fields
      if (!project.id_referent || !project.nom_centrale) {
        errors.push({ row: i + 1, error: 'Missing id_referent or nom_centrale', project })
        continue
      }

      // Parse audit types
      let auditTypes = []
      try {
        if (project.type_audit.includes(',')) {
          auditTypes = project.type_audit.split(',').map((t: string) => t.trim())
        } else {
          auditTypes = [project.type_audit.trim()]
        }
      } catch (e) {
        auditTypes = ['CONFORMITE'] // Default
      }

      projects.push({
        id_referent: project.id_referent,
        name: project.nom_centrale,
        site_address: project.adresse || '',
        installation_power: parseFloat(project.puissance_kwc) || 0,
        audit_types: JSON.stringify(auditTypes),
        is_girasole: 1,
        client_id: client_id || 1, // Default: GIRASOLE Energies
        date_planifiee: project.date_planifiee || null,
        commentaires: project.commentaires || ''
      })
    }

    console.log(`📊 CSV Import: ${projects.length} projects parsed, ${errors.length} errors`)

    // Insert projects into database
    let insertedCount = 0
    const insertErrors = []

    for (const p of projects) {
      try {
        await DB.prepare(`
          INSERT INTO projects (
            client_id, name, id_referent, site_address,
            installation_power, audit_types, is_girasole
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          p.client_id,
          p.name,
          p.id_referent,
          p.site_address,
          p.installation_power,
          p.audit_types,
          p.is_girasole
        ).run()
        
        insertedCount++
      } catch (error: any) {
        insertErrors.push({ project: p.name, error: error.message })
      }
    }

    return c.json({
      success: true,
      summary: {
        total_rows: lines.length - 1,
        parsed: projects.length,
        inserted: insertedCount,
        parse_errors: errors.length,
        insert_errors: insertErrors.length
      },
      errors: {
        parse: errors,
        insert: insertErrors
      },
      message: `✅ ${insertedCount} projects imported successfully`
    })
  } catch (error) {
    console.error('Error importing CSV:', error)
    return c.json({ error: 'Failed to import CSV', details: error }, 500)
  }
})

// =============================================================================
// 13. TEMPLATE CSV PLANIFICATEUR (DOWNLOAD)
// =============================================================================
girasoleRoutes.get('/import/template-csv', async (c) => {
  const template = `id_referent,nom_centrale,adresse,puissance_kwc,type_audit,date_planifiee,commentaires
31971,Bouix,Bouix 11100,250,CONFORMITE,2025-01-15,Centrale SOL
32010,EARL CADOT,CADOT 34000,300,"CONFORMITE,TOITURE",2025-01-20,Centrale DOUBLE avec toiture
32015,Example Hangar,Route de Lyon 69000,180,CONFORMITE,2025-01-25,Centrale SOL standard`

  return c.text(template, 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="GIRASOLE_PLANNING_TEMPLATE.csv"'
  })
})

// =============================================================================
// 14. DASHBOARD MARGES CLIENT (RENTABILITÉ MISSION)
// =============================================================================
girasoleRoutes.get('/dashboard/marges', async (c) => {
  const { DB } = c.env

  try {
    // Get project completion stats
    const { results: stats } = await DB.prepare(`
      SELECT 
        COUNT(DISTINCT p.id) as total_projects,
        COUNT(DISTINCT CASE WHEN vi.audit_token IS NOT NULL THEN p.id END) as completed_projects,
        SUM(p.installation_power) as total_power_kwc
      FROM projects p
      LEFT JOIN visual_inspections vi ON p.id = vi.project_id
      WHERE p.is_girasole = 1
    `).all()

    const totalProjects = stats?.[0]?.total_projects || 52
    const completedProjects = stats?.[0]?.completed_projects || 0
    const totalPowerKwc = stats?.[0]?.total_power_kwc || 0

    // Mission financials
    const budgetTotal = 66885 // € HT
    const costPerCentrale = budgetTotal / totalProjects
    const revenueCompleted = completedProjects * costPerCentrale
    const revenueRemaining = (totalProjects - completedProjects) * costPerCentrale
    const completionRate = (completedProjects / totalProjects) * 100

    // Estimated costs (assumptions)
    const estimatedHoursPerCentrale = 4 // hours
    const hourlyRate = 85 // €/hour
    const travelCostPerCentrale = 150 // € (fuel, tolls)
    const estimatedCostPerCentrale = (estimatedHoursPerCentrale * hourlyRate) + travelCostPerCentrale

    const totalEstimatedCost = totalProjects * estimatedCostPerCentrale
    const marginPerCentrale = costPerCentrale - estimatedCostPerCentrale
    const totalMargin = budgetTotal - totalEstimatedCost
    const marginRate = (totalMargin / budgetTotal) * 100

    // Get projects with audit types breakdown
    const { results: projects } = await DB.prepare(`
      SELECT 
        p.id,
        p.name,
        p.id_referent,
        p.installation_power,
        p.audit_types,
        COUNT(DISTINCT vi.audit_token) as audits_completed
      FROM projects p
      LEFT JOIN visual_inspections vi ON p.id = vi.project_id
      WHERE p.is_girasole = 1
      GROUP BY p.id
      ORDER BY p.id_referent ASC
    `).all()

    // Calculate per-project costs
    const projectsWithCosts = projects?.map((p: any) => {
      const auditTypes = JSON.parse(p.audit_types || '[]')
      const isDouble = auditTypes.includes('TOITURE')
      const estimatedTime = isDouble ? 6 : 4 // hours (DOUBLE takes longer)
      const cost = (estimatedTime * hourlyRate) + travelCostPerCentrale
      const revenue = costPerCentrale
      const margin = revenue - cost
      const status = (p.audits_completed || 0) > 0 ? 'completed' : 'pending'

      return {
        ...p,
        isDouble,
        estimatedTime,
        cost: cost.toFixed(0),
        revenue: revenue.toFixed(0),
        margin: margin.toFixed(0),
        marginRate: ((margin / revenue) * 100).toFixed(1),
        status
      }
    })

    // HTML Dashboard
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GIRASOLE - Dashboard Marges</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-50">
  <div class="max-w-7xl mx-auto p-8">
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-green-600">💰 DiagPV - Dashboard Marges GIRASOLE</h1>
      <p class="text-gray-600 mt-2">Analyse Rentabilité Mission 52 Centrales Photovoltaïques</p>
    </div>

    <!-- Financial Overview -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-2">Budget Total</div>
        <div class="text-3xl font-bold text-blue-600">${budgetTotal.toLocaleString()} €</div>
        <div class="text-xs text-gray-500 mt-1">HT</div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-2">Coût/Centrale</div>
        <div class="text-3xl font-bold text-purple-600">${costPerCentrale.toFixed(0)} €</div>
        <div class="text-xs text-gray-500 mt-1">Moyen</div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-2">Marge Totale</div>
        <div class="text-3xl font-bold text-green-600">${totalMargin.toFixed(0)} €</div>
        <div class="text-xs text-gray-500 mt-1">${marginRate.toFixed(1)}% marge</div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-2">Progression</div>
        <div class="text-3xl font-bold text-orange-600">${completionRate.toFixed(1)}%</div>
        <div class="text-xs text-gray-500 mt-1">${completedProjects}/${totalProjects} centrales</div>
      </div>
    </div>

    <!-- Revenue Breakdown -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4">💵 Facturation</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center p-3 bg-green-50 rounded">
            <span class="font-semibold">CA Complété</span>
            <span class="text-2xl font-bold text-green-600">${revenueCompleted.toFixed(0)} €</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-orange-50 rounded">
            <span class="font-semibold">CA Restant</span>
            <span class="text-2xl font-bold text-orange-600">${revenueRemaining.toFixed(0)} €</span>
          </div>
          <div class="text-sm text-gray-600 mt-4">
            <div class="flex justify-between mb-2">
              <span>Centrales SOL (39)</span>
              <span>${(39 * costPerCentrale).toFixed(0)} €</span>
            </div>
            <div class="flex justify-between">
              <span>Centrales DOUBLE (13)</span>
              <span>${(13 * costPerCentrale).toFixed(0)} €</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4">💸 Coûts Estimés</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center p-3 bg-red-50 rounded">
            <span class="font-semibold">Coût Total Estimé</span>
            <span class="text-2xl font-bold text-red-600">${totalEstimatedCost.toFixed(0)} €</span>
          </div>
          <div class="text-sm space-y-2 mt-4">
            <div class="flex justify-between p-2 border-b">
              <span>Temps moyen/centrale</span>
              <span class="font-semibold">${estimatedHoursPerCentrale}h</span>
            </div>
            <div class="flex justify-between p-2 border-b">
              <span>Taux horaire</span>
              <span class="font-semibold">${hourlyRate} €/h</span>
            </div>
            <div class="flex justify-between p-2 border-b">
              <span>Frais déplacement</span>
              <span class="font-semibold">${travelCostPerCentrale} €</span>
            </div>
            <div class="flex justify-between p-2 font-bold">
              <span>Coût unitaire estimé</span>
              <span class="text-red-600">${estimatedCostPerCentrale} €</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Projects Table -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold mb-4">📊 Détail par Centrale</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 text-left">ID Ref</th>
              <th class="p-2 text-left">Centrale</th>
              <th class="p-2 text-center">Type</th>
              <th class="p-2 text-center">Puissance</th>
              <th class="p-2 text-center">Temps Est.</th>
              <th class="p-2 text-center">Revenu</th>
              <th class="p-2 text-center">Coût Est.</th>
              <th class="p-2 text-center">Marge</th>
              <th class="p-2 text-center">Taux Marge</th>
              <th class="p-2 text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${(projectsWithCosts || []).map((p: any) => `
              <tr class="border-b hover:bg-gray-50">
                <td class="p-2 font-mono text-xs">${p.id_referent || 'N/A'}</td>
                <td class="p-2">${p.name}</td>
                <td class="p-2 text-center">
                  <span class="px-2 py-1 rounded text-xs font-semibold ${p.isDouble ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                    ${p.isDouble ? 'DOUBLE' : 'SOL'}
                  </span>
                </td>
                <td class="p-2 text-center">${p.installation_power || 0} kWc</td>
                <td class="p-2 text-center">${p.estimatedTime}h</td>
                <td class="p-2 text-center font-semibold text-green-600">${p.revenue} €</td>
                <td class="p-2 text-center font-semibold text-red-600">${p.cost} €</td>
                <td class="p-2 text-center font-bold ${parseFloat(p.margin) >= 0 ? 'text-green-600' : 'text-red-600'}">${p.margin} €</td>
                <td class="p-2 text-center font-bold ${parseFloat(p.marginRate) >= 20 ? 'text-green-600' : parseFloat(p.marginRate) >= 10 ? 'text-yellow-600' : 'text-red-600'}">${p.marginRate}%</td>
                <td class="p-2 text-center">
                  <span class="px-2 py-1 rounded-full text-xs font-semibold ${p.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${p.status === 'completed' ? '✅' : '⏳'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-8 text-center text-sm text-gray-500">
      <p><strong>DiagPV - Diagnostic Photovoltaïque</strong></p>
      <p>3 rue d'Apollo, 31240 L'Union | 05.81.10.16.59 | contact@diagpv.fr | RCS 792972309</p>
      <p class="mt-2">Dashboard généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    </div>
  </div>
</body>
</html>`

    return c.html(html)
  } catch (error) {
    console.error('Error generating margins dashboard:', error)
    return c.json({ error: 'Failed to generate margins dashboard', details: error }, 500)
  }
})

export default girasoleRoutes
