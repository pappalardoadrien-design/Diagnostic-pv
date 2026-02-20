/**
 * Admin Routes - Routes d'administration et maintenance DB
 * Extrait de index.tsx le 2026-02-20 (refactoring)
 * 
 * Routes:
 * - GET /admin/emergency-db-fix
 */

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const adminRoutes = new Hono<{ Bindings: Bindings }>()

adminRoutes.get('/emergency-db-fix', async (c) => {
  const { DB } = c.env
  const logs: string[] = []
  
  const runQuery = async (query: string, label: string) => {
    try {
      await DB.prepare(query).run()
      logs.push(`✅ SUCCÈS: ${label}`)
    } catch (e: any) {
      if (e.message.includes('duplicate column')) {
        logs.push(`ℹ️ INFO: ${label} (Déjà existant)`)
      } else {
        logs.push(`❌ ERREUR: ${label} - ${e.message}`)
      }
    }
  }

  // 1. Mettre à jour la table PROJECTS
  await runQuery("ALTER TABLE projects ADD COLUMN inverter_count INTEGER DEFAULT 0", "Projects: Ajout inverter_count")
  await runQuery("ALTER TABLE projects ADD COLUMN inverter_brand TEXT", "Projects: Ajout inverter_brand")
  await runQuery("ALTER TABLE projects ADD COLUMN junction_box_count INTEGER DEFAULT 0", "Projects: Ajout junction_box_count")
  await runQuery("ALTER TABLE projects ADD COLUMN strings_configuration TEXT", "Projects: Ajout strings_configuration")
  await runQuery("ALTER TABLE projects ADD COLUMN technical_notes TEXT", "Projects: Ajout technical_notes")
  
  // 1.1 Ajout colonnes "modernes" manquantes (si ancien schéma 0004)
  await runQuery("ALTER TABLE projects ADD COLUMN total_power_kwp REAL", "Projects: Ajout total_power_kwp")
  await runQuery("ALTER TABLE projects ADD COLUMN module_count INTEGER", "Projects: Ajout module_count")
  await runQuery("ALTER TABLE projects ADD COLUMN module_type TEXT", "Projects: Ajout module_type")
  await runQuery("ALTER TABLE projects ADD COLUMN inverter_type TEXT", "Projects: Ajout inverter_type")
  await runQuery("ALTER TABLE projects ADD COLUMN address_street TEXT", "Projects: Ajout address_street")
  await runQuery("ALTER TABLE projects ADD COLUMN address_postal_code TEXT", "Projects: Ajout address_postal_code")
  await runQuery("ALTER TABLE projects ADD COLUMN address_city TEXT", "Projects: Ajout address_city")
  await runQuery("ALTER TABLE projects ADD COLUMN gps_latitude REAL", "Projects: Ajout gps_latitude")
  await runQuery("ALTER TABLE projects ADD COLUMN gps_longitude REAL", "Projects: Ajout gps_longitude")

  // 2. Mettre à jour la table EL_AUDITS
  await runQuery("ALTER TABLE el_audits ADD COLUMN configuration_json TEXT", "EL Audits: Ajout configuration_json")
  await runQuery("ALTER TABLE el_audits ADD COLUMN inverter_count INTEGER", "EL Audits: Ajout inverter_count")
  await runQuery("ALTER TABLE el_audits ADD COLUMN junction_boxes INTEGER", "EL Audits: Ajout junction_boxes")

  // 3. Mettre à jour la table EL_MODULES (positions physiques)
  await runQuery("ALTER TABLE el_modules ADD COLUMN physical_row INTEGER", "EL Modules: Ajout physical_row")
  await runQuery("ALTER TABLE el_modules ADD COLUMN physical_col INTEGER", "EL Modules: Ajout physical_col")

  // 3.1 PV_PLANTS - Liaison avec CRM clients
  await runQuery("ALTER TABLE pv_plants ADD COLUMN client_id INTEGER REFERENCES crm_clients(id)", "PV Plants: Ajout client_id")
  await runQuery("CREATE INDEX IF NOT EXISTS idx_pv_plants_client_id ON pv_plants(client_id)", "PV Plants: Index client_id")
  
  // 3.2 Mise à jour ALBAGNAC 2 avec client Broussy Energie (client_id = 9)
  await runQuery("UPDATE pv_plants SET client_id = 9 WHERE plant_name = 'ALBAGNAC 2' AND client_id IS NULL", "PV Plants: Liaison ALBAGNAC 2 → Broussy Energie")

  // 4. Mettre à jour les tables VISUAL et PROJECTS (Girasole & Thermal)
  await runQuery("ALTER TABLE visual_inspections ADD COLUMN checklist_type TEXT DEFAULT 'IEC_62446'", "Visual: Ajout checklist_type")
  await runQuery("ALTER TABLE visual_inspections ADD COLUMN project_id INTEGER", "Visual: Ajout project_id")
  await runQuery("ALTER TABLE projects ADD COLUMN is_girasole INTEGER DEFAULT 0", "Projects: Ajout is_girasole")
  await runQuery("ALTER TABLE projects ADD COLUMN id_referent TEXT", "Projects: Ajout id_referent")
  await runQuery("ALTER TABLE thermal_measurements ADD COLUMN audit_token TEXT", "Thermal: Ajout audit_token")

  // 4.5 Création table el_audit_notes si elle n'existe pas
  await runQuery(`
    CREATE TABLE IF NOT EXISTS el_audit_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      el_audit_id INTEGER NOT NULL,
      audit_token TEXT NOT NULL,
      note_type TEXT DEFAULT 'text' CHECK(note_type IN ('text', 'voice', 'photo')),
      content TEXT,
      audio_url TEXT,
      photo_url TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (el_audit_id) REFERENCES el_audits(id) ON DELETE CASCADE
    )
  `, "EL Audit Notes: Création table")
  await runQuery("CREATE INDEX IF NOT EXISTS idx_el_audit_notes_audit ON el_audit_notes(el_audit_id)", "EL Audit Notes: Index audit_id")
  await runQuery("CREATE INDEX IF NOT EXISTS idx_el_audit_notes_token ON el_audit_notes(audit_token)", "EL Audit Notes: Index token")

  // 4.6 Création table el_audit_plants si elle n'existe pas  
  await runQuery(`
    CREATE TABLE IF NOT EXISTS el_audit_plants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      el_audit_id INTEGER NOT NULL,
      audit_token TEXT NOT NULL,
      plant_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (el_audit_id) REFERENCES el_audits(id) ON DELETE CASCADE,
      FOREIGN KEY (plant_id) REFERENCES pv_plants(id) ON DELETE CASCADE,
      UNIQUE(el_audit_id, plant_id)
    )
  `, "EL Audit Plants: Création table liaison")
  await runQuery("CREATE INDEX IF NOT EXISTS idx_el_audit_plants_audit ON el_audit_plants(el_audit_id)", "EL Audit Plants: Index audit_id")
  await runQuery("CREATE INDEX IF NOT EXISTS idx_el_audit_plants_plant ON el_audit_plants(plant_id)", "EL Audit Plants: Index plant_id")

  // 5. MIGRATION DES DONNÉES JSON DANS NOTES (NOUVEAU)
  try {
    const projects = await DB.prepare("SELECT id, notes FROM projects WHERE notes LIKE '%[MIGRATION_PENDING_DATA]%'").all();
    if (projects.results && projects.results.length > 0) {
      logs.push(`🔄 MIGRATION: ${projects.results.length} projets à migrer trouvés.`);
      
      for (const project of projects.results as any[]) {
        try {
          const notes = project.notes as string;
          const jsonMatch = notes.match(/\[MIGRATION_PENDING_DATA\](.*)/s); // Capture everything after the tag
          
          if (jsonMatch && jsonMatch[1]) {
            const jsonData = JSON.parse(jsonMatch[1]);
            
            // Prepare update query dynamically based on what's in JSON
            const mapping: Record<string, string> = {
              'inverter_count': 'inverter_count',
              'address_street': 'address_street',
              'total_power_kwp': 'total_power_kwp',
              'strings_configuration': 'strings_configuration',
              'module_type': 'module_type',
              'inverter_brand': 'inverter_brand',
              'inverter_type': 'inverter_type',
              'address_postal_code': 'address_postal_code',
              'address_city': 'address_city',
              'gps_latitude': 'gps_latitude',
              'gps_longitude': 'gps_longitude'
            };

            const updates: string[] = [];
            const values: any[] = [];

            for (const [jsonKey, dbCol] of Object.entries(mapping)) {
              if (jsonData[jsonKey] !== undefined && jsonData[jsonKey] !== null) {
                updates.push(`${dbCol} = ?`);
                values.push(jsonData[jsonKey]);
              }
            }
            
            // Clean the notes (remove the JSON part)
            const cleanNotes = notes.replace(/\[MIGRATION_PENDING_DATA\].*/s, '').trim();
            updates.push("notes = ?");
            values.push(cleanNotes);
            
            values.push(project.id); // For WHERE clause

            if (updates.length > 0) {
              const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`;
              await DB.prepare(query).bind(...values).run();
              logs.push(`✅ MIGRATION PROJET #${project.id}: Données extraites et notes nettoyées.`);
            }
          }
        } catch (err: any) {
          logs.push(`❌ ERREUR MIGRATION PROJET #${project.id}: ${err.message}`);
        }
      }
    } else {
      logs.push(`ℹ️ MIGRATION: Aucun projet nécessitant une migration trouvé.`);
    }
  } catch (e: any) {
    logs.push(`❌ ERREUR GLOBAL MIGRATION: ${e.message}`);
  }

  return c.html(`
    <html>
      <body style="font-family: monospace; padding: 20px; background: #111; color: #0f0;">
        <h1>Rapport de Réparation BDD</h1>
        <ul>
          ${logs.map(l => `<li>${l}</li>`).join('')}
        </ul>
        <br>
        <a href="/" style="color: #fff; font-size: 20px;">RETOUR ACCUEIL</a>
      </body>
    </html>
  `)
})


export default adminRoutes
