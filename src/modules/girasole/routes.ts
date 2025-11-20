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
      SELECT inspection_token, COUNT(*) as items_count
      FROM visual_inspections
      WHERE project_id = ? AND checklist_type = ?
      GROUP BY inspection_token
      LIMIT 1
    `).bind(project_id, checklist_type).first()

    if (existing) {
      return c.json({
        inspection: {
          token: existing.inspection_token,
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
          project_id, checklist_type, inspection_token,
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
      WHERE inspection_token = ?
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
      WHERE inspection_token = ? AND inspection_type = ?
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
  // Placeholder - will generate HTML report
  return c.html('<h1>GIRASOLE Report - Coming Soon</h1>')
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
            inspection_token,
            conformite
          FROM visual_inspections
          WHERE project_id = ?
        `).bind(p.id).all()

        const tokens = new Set((inspections || []).map((i: any) => i.inspection_token).filter(Boolean))
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

export default girasoleRoutes
