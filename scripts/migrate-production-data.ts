/**
 * Script de migration données production Module EL → Schéma unifié
 * 
 * Ce script migre les données de l'ancien schéma Module EL standalone
 * vers le nouveau schéma D1 unifié de la plateforme DiagPV.
 * 
 * Données source:
 * - /tmp/prod_export_audits.json (2 audits)
 * - /tmp/prod_export_modules.json (462 modules)
 * 
 * Transformation:
 * - audits → el_audits (avec création clients/projects/interventions)
 * - modules → el_modules (mapping statuts + severity_level)
 * 
 * Exécution: npx tsx scripts/migrate-production-data.ts --env local
 */

import * as fs from 'fs'
import * as path from 'path'

// ============================================================================
// TYPES
// ============================================================================

interface OldAudit {
  id: number
  token: string
  project_name: string
  client_name: string
  location: string
  string_count: number
  modules_per_string: number
  total_modules: number
  plan_file?: string
  status: string
  json_config?: string
  created_at: string
  updated_at: string
}

interface OldModule {
  id: number
  audit_token: string
  module_id: string
  string_number: number
  position_in_string: number
  status: string
  comment?: string
  technician_id?: string
  physical_row?: number
  physical_col?: number
  created_at: string
  updated_at: string
}

interface MigrationStats {
  audits_migrated: number
  modules_migrated: number
  clients_created: number
  projects_created: number
  interventions_created: number
  errors: string[]
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const EXPORTS_DIR = '/tmp'
const AUDITS_FILE = path.join(EXPORTS_DIR, 'prod_export_audits.json')
const MODULES_FILE = path.join(EXPORTS_DIR, 'prod_export_modules.json')

// Mapping anciens statuts → nouveaux defect_type + severity_level
const STATUS_MAPPING: Record<string, { defect_type: string; severity_level: number }> = {
  'ok': { defect_type: 'none', severity_level: 0 },
  'pending': { defect_type: 'pending', severity_level: 0 },
  'microcracks': { defect_type: 'microcrack', severity_level: 2 },
  'dead': { defect_type: 'dead_module', severity_level: 3 },
  'inequality': { defect_type: 'luminescence_inequality', severity_level: 1 }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Charge et parse un fichier JSON d'export
 */
function loadExportFile<T>(filePath: string): T[] {
  console.log(`📂 Chargement: ${filePath}`)
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(content)
  
  // Format Wrangler D1: [{results: [...]}]
  if (Array.isArray(parsed) && parsed[0]?.results) {
    return parsed[0].results as T[]
  }
  
  // Format direct: [...]
  return parsed as T[]
}

/**
 * Transforme un statut ancien vers nouveau format
 */
function transformStatus(oldStatus: string): { defect_type: string; severity_level: number } {
  const mapping = STATUS_MAPPING[oldStatus.toLowerCase()]
  if (!mapping) {
    console.warn(`⚠️  Statut inconnu: "${oldStatus}" → défaut: pending/0`)
    return { defect_type: 'pending', severity_level: 0 }
  }
  return mapping
}

/**
 * Génère SQL INSERT pour une table
 */
function generateInsertSQL(
  table: string, 
  columns: string[], 
  values: any[][]
): string {
  const columnsStr = columns.join(', ')
  const valuesStr = values
    .map(row => {
      const vals = row.map(v => {
        if (v === null || v === undefined) return 'NULL'
        if (typeof v === 'number') return v.toString()
        if (typeof v === 'boolean') return v ? '1' : '0'
        // Escape single quotes
        return `'${String(v).replace(/'/g, "''")}'`
      })
      return `(${vals.join(', ')})`
    })
    .join(',\n    ')
  
  return `INSERT INTO ${table} (${columnsStr}) VALUES\n    ${valuesStr};`
}

// ============================================================================
// MIGRATION PRINCIPALE
// ============================================================================

async function migrateData(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    audits_migrated: 0,
    modules_migrated: 0,
    clients_created: 0,
    projects_created: 0,
    interventions_created: 0,
    errors: []
  }

  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║  MIGRATION DONNÉES PRODUCTION MODULE EL → SCHÉMA UNIFIÉ     ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  try {
    // Étape 1: Charger données sources
    console.log('📦 ÉTAPE 1: Chargement données sources')
    console.log('─────────────────────────────────────────────────────────────')
    
    const audits = loadExportFile<OldAudit>(AUDITS_FILE)
    const modules = loadExportFile<OldModule>(MODULES_FILE)
    
    console.log(`✅ ${audits.length} audits chargés`)
    console.log(`✅ ${modules.length} modules chargés\n`)

    // Étape 2: Créer utilisateur technicien par défaut
    console.log('👤 ÉTAPE 2: Création utilisateur technicien par défaut')
    console.log('─────────────────────────────────────────────────────────────')
    
    const userSQL = generateInsertSQL(
      'users',
      ['email', 'name', 'role', 'certification_level', 'is_active'],
      [['tech@diagpv.fr', 'Technicien DiagPV', 'technician', 'N2', 1]]
    )
    console.log(userSQL)
    console.log('✅ 1 technicien créé (id=1)\n')

    // Étape 3: Créer clients uniques
    console.log('🏢 ÉTAPE 3: Création clients uniques')
    console.log('─────────────────────────────────────────────────────────────')
    
    const uniqueClients = [...new Set(audits.map(a => a.client_name))]
    const clientsSQL = generateInsertSQL(
      'clients',
      ['name', 'contact_email'],
      uniqueClients.map(name => [name, null])
    )
    console.log(clientsSQL)
    console.log(`✅ ${uniqueClients.length} clients créés\n`)
    stats.clients_created = uniqueClients.length

    // Étape 4: Créer projets
    console.log('🏗️  ÉTAPE 4: Création projets')
    console.log('─────────────────────────────────────────────────────────────')
    
    const projectsSQL = generateInsertSQL(
      'projects',
      ['client_id', 'name', 'site_address', 'string_count', 'modules_per_string', 'total_modules'],
      audits.map((audit, idx) => [
        uniqueClients.indexOf(audit.client_name) + 1, // client_id
        audit.project_name,
        audit.location || 'Non renseigné',
        audit.string_count,
        audit.modules_per_string,
        audit.total_modules
      ])
    )
    console.log(projectsSQL)
    console.log(`✅ ${audits.length} projets créés\n`)
    stats.projects_created = audits.length

    // Étape 5: Créer interventions
    console.log('📋 ÉTAPE 5: Création interventions EL')
    console.log('─────────────────────────────────────────────────────────────')
    
    const interventionsSQL = generateInsertSQL(
      'interventions',
      ['project_id', 'technician_id', 'intervention_type', 'intervention_date', 'status'],
      audits.map((audit, idx) => [
        idx + 1, // project_id
        1, // technician_id (technicien par défaut)
        'el',
        audit.created_at.split('T')[0], // Date uniquement
        'completed'
      ])
    )
    console.log(interventionsSQL)
    console.log(`✅ ${audits.length} interventions créées\n`)
    stats.interventions_created = audits.length

    // Étape 6: Créer audits EL
    console.log('⚡ ÉTAPE 6: Migration audits → el_audits')
    console.log('─────────────────────────────────────────────────────────────')
    
    const auditsSQL = generateInsertSQL(
      'el_audits',
      [
        'intervention_id', 'audit_token', 'project_name', 'client_name', 'location',
        'string_count', 'modules_per_string', 'total_modules', 'configuration_json',
        'status', 'created_at', 'updated_at'
      ],
      audits.map((audit, idx) => [
        idx + 1, // intervention_id
        audit.token,
        audit.project_name,
        audit.client_name,
        audit.location || '',
        audit.string_count,
        audit.modules_per_string,
        audit.total_modules,
        audit.json_config || null,
        audit.status,
        audit.created_at,
        audit.updated_at
      ])
    )
    console.log(auditsSQL)
    console.log(`✅ ${audits.length} audits EL migrés\n`)
    stats.audits_migrated = audits.length

    // Étape 7: Migrer modules
    console.log('🔬 ÉTAPE 7: Migration modules → el_modules')
    console.log('─────────────────────────────────────────────────────────────')
    
    // Grouper modules par audit pour récupérer el_audit_id
    const modulesByAudit = modules.reduce((acc, mod) => {
      if (!acc[mod.audit_token]) acc[mod.audit_token] = []
      acc[mod.audit_token].push(mod)
      return acc
    }, {} as Record<string, OldModule[]>)

    let modulesSQL = ''
    let totalModules = 0

    audits.forEach((audit, auditIdx) => {
      const auditModules = modulesByAudit[audit.token] || []
      if (auditModules.length === 0) return

      const el_audit_id = auditIdx + 1
      
      const modulesValues = auditModules.map(mod => {
        const { defect_type, severity_level } = transformStatus(mod.status)
        return [
          el_audit_id,
          mod.audit_token,
          mod.module_id,
          mod.string_number,
          mod.position_in_string,
          defect_type,
          severity_level,
          mod.comment || null,
          1, // technician_id
          mod.physical_row || null,
          mod.physical_col || null,
          null, // image_url
          mod.created_at,
          mod.updated_at
        ]
      })

      modulesSQL += generateInsertSQL(
        'el_modules',
        [
          'el_audit_id', 'audit_token', 'module_identifier', 'string_number', 'position_in_string',
          'defect_type', 'severity_level', 'comment', 'technician_id',
          'physical_row', 'physical_col', 'image_url', 'created_at', 'updated_at'
        ],
        modulesValues
      ) + '\n\n'

      totalModules += auditModules.length
    })

    console.log(modulesSQL)
    console.log(`✅ ${totalModules} modules EL migrés\n`)
    stats.modules_migrated = totalModules

    // Étape 8: Génération fichier SQL complet
    console.log('💾 ÉTAPE 8: Génération fichier SQL migration')
    console.log('─────────────────────────────────────────────────────────────')
    
    const fullSQL = `-- ============================================================================
-- MIGRATION DONNÉES PRODUCTION MODULE EL → SCHÉMA UNIFIÉ
-- ============================================================================
-- Date: ${new Date().toISOString()}
-- Source: prod_export_audits.json + prod_export_modules.json
-- 
-- Statistiques:
-- - ${stats.clients_created} clients
-- - ${stats.projects_created} projets
-- - ${stats.interventions_created} interventions
-- - ${stats.audits_migrated} audits EL
-- - ${stats.modules_migrated} modules EL
-- ============================================================================

-- Désactiver foreign keys temporairement pour insertion rapide
PRAGMA foreign_keys = OFF;

${userSQL}

${clientsSQL}

${projectsSQL}

${interventionsSQL}

${auditsSQL}

${modulesSQL}

-- Réactiver foreign keys
PRAGMA foreign_keys = ON;

-- Vérifications intégrité
SELECT 'Clients créés:' as check_type, COUNT(*) as count FROM clients
UNION ALL
SELECT 'Projets créés:', COUNT(*) FROM projects
UNION ALL
SELECT 'Interventions créées:', COUNT(*) FROM interventions
UNION ALL
SELECT 'Audits EL migrés:', COUNT(*) FROM el_audits
UNION ALL
SELECT 'Modules EL migrés:', COUNT(*) FROM el_modules;

-- Distribution statuts modules
SELECT 
  defect_type,
  severity_level,
  COUNT(*) as count
FROM el_modules
GROUP BY defect_type, severity_level
ORDER BY severity_level DESC, count DESC;
`

    const outputPath = path.join('/home/user/diagnostic-hub/scripts', 'migration_data.sql')
    fs.writeFileSync(outputPath, fullSQL, 'utf-8')
    console.log(`✅ Fichier SQL généré: ${outputPath}`)
    console.log(`📦 Taille: ${(fullSQL.length / 1024).toFixed(1)} KB\n`)

    // Résumé final
    console.log('╔═══════════════════════════════════════════════════════════════╗')
    console.log('║  RÉSUMÉ MIGRATION                                            ║')
    console.log('╚═══════════════════════════════════════════════════════════════╝')
    console.log(`✅ Clients créés:          ${stats.clients_created}`)
    console.log(`✅ Projets créés:          ${stats.projects_created}`)
    console.log(`✅ Interventions créées:   ${stats.interventions_created}`)
    console.log(`✅ Audits EL migrés:       ${stats.audits_migrated}`)
    console.log(`✅ Modules EL migrés:      ${stats.modules_migrated}`)
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Erreurs: ${stats.errors.length}`)
      stats.errors.forEach(err => console.log(`   - ${err}`))
    }

    console.log('\n🎯 Prochaine étape: Exécuter migration_data.sql en local')
    console.log('   npx wrangler d1 execute diagnostic-hub-production --local --file=scripts/migration_data.sql')

  } catch (error) {
    console.error('❌ ERREUR FATALE:', error)
    stats.errors.push(String(error))
    throw error
  }

  return stats
}

// ============================================================================
// POINT D'ENTRÉE
// ============================================================================

// Exécution directe du script
migrateData()
  .then(stats => {
    console.log('\n✅ Migration terminée avec succès!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Migration échouée:', error)
    process.exit(1)
  })

export { migrateData, MigrationStats }
