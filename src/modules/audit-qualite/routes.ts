/**
 * Module Audit Qualité Terrain - Routes API
 * Intégration GIRASOLE → DiagPV CRM
 * 
 * Préfixe: /api/audit-qualite
 * 
 * Endpoints:
 * --- Missions ---
 * GET    /missions                       - Liste missions (filtres: statut, client_id, project_id)
 * POST   /missions                       - Créer une mission
 * GET    /missions/:id                   - Détail mission + stats
 * PUT    /missions/:id                   - Modifier mission
 * DELETE /missions/:id                   - Supprimer mission
 * PUT    /missions/:id/statut            - Changer statut mission
 * 
 * --- Checklist SOL (NF C 15-100) ---
 * GET    /missions/:id/checklist/sol     - Items checklist SOL
 * POST   /missions/:id/checklist/sol/init - Initialiser checklist SOL (36 items)
 * PUT    /checklist/sol/:itemId          - MAJ conformité item SOL
 * 
 * --- Checklist TOITURE (DTU 40.35) ---
 * GET    /missions/:id/checklist/toiture     - Items checklist toiture
 * POST   /missions/:id/checklist/toiture/init - Initialiser depuis template
 * PUT    /checklist/toiture/:itemId          - MAJ conformité item toiture
 * 
 * --- Photos Item ---
 * GET    /missions/:id/photos            - Toutes les photos d'une mission
 * POST   /checklist/:type/:itemId/photos - Upload photo pour un item
 * DELETE /photos/:photoId                - Supprimer une photo
 * 
 * --- Commentaires Finaux ---
 * GET    /missions/:id/commentaires      - Commentaire final
 * POST   /missions/:id/commentaires      - Créer/MAJ commentaire final
 * 
 * --- Photos Générales ---
 * GET    /missions/:id/photos-generales  - Photos générales mission
 * POST   /missions/:id/photos-generales  - Upload photo générale
 * DELETE /photos-generales/:photoId      - Supprimer photo générale
 * 
 * --- Rapports ---
 * POST   /missions/:id/rapport/generer   - Générer rapport HTML
 * GET    /rapports/:rapportId            - Consulter rapport
 * PUT    /rapports/:rapportId/valider    - Valider rapport
 * 
 * --- Stats & Dashboard ---
 * GET    /stats                          - Stats globales audit qualité
 * GET    /stats/kpi                      - KPI pour dashboard CRM
 * 
 * --- Sous-traitants & Techniciens ---
 * GET    /sous-traitants                 - Liste sous-traitants
 * POST   /sous-traitants                 - Créer sous-traitant
 * PUT    /sous-traitants/:id             - Modifier sous-traitant
 * GET    /techniciens                    - Liste techniciens
 * POST   /techniciens                    - Créer technicien
 * PUT    /techniciens/:id                - Modifier technicien
 */

import { Hono } from 'hono';

type Bindings = { DB: D1Database; KV: KVNamespace; R2: R2Bucket };

const auditQualiteRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// HELPERS
// ============================================================================

function generateReference(prefix: string, id: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(id).padStart(3, '0')}`;
}

// Template checklist SOL (NF C 15-100) - 36 items, 7 catégories
const CHECKLIST_SOL_TEMPLATE = [
  // MODULES (8 items)
  { categorie: 'modules', code: 'MOD-01', libelle: 'Fixation des modules sur les supports conforme', norme: 'NF EN 62446-1 §6.1', severite: 'critique' },
  { categorie: 'modules', code: 'MOD-02', libelle: 'Absence de modules cassés ou fissurés', norme: 'IEC 61215', severite: 'critique' },
  { categorie: 'modules', code: 'MOD-03', libelle: 'Absence de hotspots visibles (décoloration)', norme: 'IEC 61215 §10.18', severite: 'majeur' },
  { categorie: 'modules', code: 'MOD-04', libelle: 'Connecteurs MC4 correctement encliquetés', norme: 'NF EN 62446-1 §6.2', severite: 'critique' },
  { categorie: 'modules', code: 'MOD-05', libelle: 'Absence d\'encrassement excessif', norme: 'IEC TS 63049', severite: 'mineur' },
  { categorie: 'modules', code: 'MOD-06', libelle: 'Étiquettes modules lisibles (Pmax, Isc, Voc)', norme: 'NF EN 62446-1 §4.2', severite: 'mineur' },
  { categorie: 'modules', code: 'MOD-07', libelle: 'Diodes bypass fonctionnelles (test thermique)', norme: 'IEC 61215 §10.18', severite: 'majeur' },
  { categorie: 'modules', code: 'MOD-08', libelle: 'Conformité des modules au cahier des charges', norme: 'NF EN 62446-1', severite: 'majeur' },
  
  // CÂBLAGE (6 items)
  { categorie: 'cablage', code: 'CAB-01', libelle: 'Câbles DC protégés et fixés correctement', norme: 'NF C 15-100 §7.712.5', severite: 'critique' },
  { categorie: 'cablage', code: 'CAB-02', libelle: 'Absence de câbles exposés aux UV sans protection', norme: 'NF EN 62446-1 §6.3', severite: 'majeur' },
  { categorie: 'cablage', code: 'CAB-03', libelle: 'Section des câbles conforme au dimensionnement', norme: 'NF C 15-100 §7.712.5.2', severite: 'critique' },
  { categorie: 'cablage', code: 'CAB-04', libelle: 'Cheminement câbles séparé DC/AC', norme: 'NF C 15-100 §7.712.5.1', severite: 'critique' },
  { categorie: 'cablage', code: 'CAB-05', libelle: 'Repérage des câbles (étiquettes string)', norme: 'NF EN 62446-1 §4.3', severite: 'mineur' },
  { categorie: 'cablage', code: 'CAB-06', libelle: 'Absence de boucles/tensions mécaniques sur câbles', norme: 'NF C 15-100 §5.52', severite: 'majeur' },
  
  // PROTECTION (5 items)
  { categorie: 'protection', code: 'PRO-01', libelle: 'Parafoudre DC installé et conforme', norme: 'NF C 15-100 §7.712.5.3', severite: 'critique' },
  { categorie: 'protection', code: 'PRO-02', libelle: 'Fusibles/disjoncteurs DC correctement dimensionnés', norme: 'NF C 15-100 §7.712.5.2', severite: 'critique' },
  { categorie: 'protection', code: 'PRO-03', libelle: 'Interrupteur-sectionneur DC accessible et fonctionnel', norme: 'NF C 15-100 §7.712.5.4', severite: 'critique' },
  { categorie: 'protection', code: 'PRO-04', libelle: 'Coffret DC étanche (IP65 minimum)', norme: 'NF EN 60529', severite: 'majeur' },
  { categorie: 'protection', code: 'PRO-05', libelle: 'Dispositif de coupure d\'urgence accessible', norme: 'NF C 15-100 §7.712.5.4', severite: 'critique' },
  
  // STRUCTURE (4 items)
  { categorie: 'structure', code: 'STR-01', libelle: 'Structures porteuses sans déformation ni corrosion', norme: 'NF EN 1090-2', severite: 'critique' },
  { categorie: 'structure', code: 'STR-02', libelle: 'Fondations/ancrages conformes (sol ou lest)', norme: 'NF EN 1997-1', severite: 'critique' },
  { categorie: 'structure', code: 'STR-03', libelle: 'Inclinaison et orientation conformes au projet', norme: 'NF EN 62446-1 §4.1', severite: 'majeur' },
  { categorie: 'structure', code: 'STR-04', libelle: 'Espacement inter-rangées conforme (ombrage)', norme: 'Guide UTE C 15-712-1', severite: 'mineur' },
  
  // ÉTIQUETAGE (4 items)
  { categorie: 'etiquetage', code: 'ETQ-01', libelle: 'Signalétique "Danger tension" visible', norme: 'NF C 15-100 §7.712.6', severite: 'critique' },
  { categorie: 'etiquetage', code: 'ETQ-02', libelle: 'Schéma unifilaire affiché dans le local technique', norme: 'NF EN 62446-1 §4.3', severite: 'majeur' },
  { categorie: 'etiquetage', code: 'ETQ-03', libelle: 'Repérage des strings sur le plan de câblage', norme: 'NF EN 62446-1 §4.3', severite: 'mineur' },
  { categorie: 'etiquetage', code: 'ETQ-04', libelle: 'Étiquettes onduleur/coffret conformes', norme: 'NF C 15-100 §7.712.6', severite: 'mineur' },
  
  // ONDULEUR (5 items)
  { categorie: 'onduleur', code: 'OND-01', libelle: 'Onduleur fonctionnel (LED/écran status OK)', norme: 'NF EN 62109-1', severite: 'critique' },
  { categorie: 'onduleur', code: 'OND-02', libelle: 'Ventilation onduleur non obstruée', norme: 'NF EN 62109-1 §8.2', severite: 'majeur' },
  { categorie: 'onduleur', code: 'OND-03', libelle: 'Conformité onduleur au cahier des charges', norme: 'NF EN 62446-1', severite: 'majeur' },
  { categorie: 'onduleur', code: 'OND-04', libelle: 'Raccordement AC conforme (section, protection)', norme: 'NF C 15-100 §7.712.5.5', severite: 'critique' },
  { categorie: 'onduleur', code: 'OND-05', libelle: 'Paramètres réseau (tension, fréquence) corrects', norme: 'NF EN 50549-1', severite: 'majeur' },
  
  // MISE À LA TERRE (4 items)
  { categorie: 'mise_terre', code: 'TER-01', libelle: 'Mise à la terre des structures métalliques', norme: 'NF C 15-100 §7.712.5.4', severite: 'critique' },
  { categorie: 'mise_terre', code: 'TER-02', libelle: 'Liaison équipotentielle conforme', norme: 'NF C 15-100 §5.44', severite: 'critique' },
  { categorie: 'mise_terre', code: 'TER-03', libelle: 'Résistance de terre mesurée < seuil', norme: 'NF C 15-100 §6.12', severite: 'critique' },
  { categorie: 'mise_terre', code: 'TER-04', libelle: 'Câble de terre section conforme (≥6mm² Cu)', norme: 'NF C 15-100 §5.44', severite: 'majeur' },
];

// ============================================================================
// MISSIONS CRUD
// ============================================================================

// GET /missions - Liste missions avec filtres
auditQualiteRoutes.get('/missions', async (c) => {
  try {
    const { DB } = c.env;
    const { statut, client_id, project_id, type_audit, limit: limitStr, offset: offsetStr } = c.req.query();
    
    let query = `SELECT * FROM v_aq_missions_stats WHERE 1=1`;
    const params: any[] = [];
    
    if (statut) { query += ` AND statut = ?`; params.push(statut); }
    if (client_id) { query += ` AND client_id = ?`; params.push(client_id); }
    if (project_id) { query += ` AND project_id = ?`; params.push(project_id); }
    if (type_audit) { query += ` AND type_audit = ?`; params.push(type_audit); }
    
    query += ` ORDER BY date_planifiee DESC, id DESC`;
    
    const limit = parseInt(limitStr || '50');
    const offset = parseInt(offsetStr || '0');
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const result = await DB.prepare(query).bind(...params).all();
    
    // Count total
    let countQuery = `SELECT COUNT(*) as total FROM ordres_mission_qualite WHERE 1=1`;
    const countParams: any[] = [];
    if (statut) { countQuery += ` AND statut = ?`; countParams.push(statut); }
    if (client_id) { countQuery += ` AND client_id = ?`; countParams.push(client_id); }
    if (project_id) { countQuery += ` AND project_id = ?`; countParams.push(project_id); }
    if (type_audit) { countQuery += ` AND type_audit = ?`; countParams.push(type_audit); }
    
    const countResult = await DB.prepare(countQuery).bind(...countParams).first();
    
    return c.json({ 
      success: true, 
      missions: result.results,
      total: countResult?.total || 0,
      limit, offset
    });
  } catch (error: any) {
    return c.json({ error: 'Erreur liste missions', details: error.message }, 500);
  }
});

// POST /missions - Créer une mission
auditQualiteRoutes.post('/missions', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json();
    
    const { project_id, client_id, technicien_id, sous_traitant_id, type_audit, priorite, date_planifiee, meteo, temperature_ambiante, irradiance, commentaire_general, notes_internes } = body;
    
    if (!project_id) return c.json({ error: 'project_id requis' }, 400);
    
    // Vérifier que le projet existe
    const project = await DB.prepare('SELECT id, name, client_id FROM projects WHERE id = ?').bind(project_id).first();
    if (!project) return c.json({ error: 'Projet introuvable' }, 404);
    
    // Utiliser client_id du projet si non fourni
    const finalClientId = client_id || project.client_id;
    
    const result = await DB.prepare(`
      INSERT INTO ordres_mission_qualite 
        (project_id, client_id, technicien_id, sous_traitant_id, type_audit, priorite, date_planifiee, meteo, temperature_ambiante, irradiance, commentaire_general, notes_internes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      project_id, finalClientId, technicien_id || null, sous_traitant_id || null,
      type_audit || 'SOL', priorite || 'normale', date_planifiee || null,
      meteo || null, temperature_ambiante || null, irradiance || null,
      commentaire_general || null, notes_internes || null
    ).run();
    
    const missionId = result.meta.last_row_id;
    
    // Générer référence
    const reference = generateReference('AQ', missionId as number);
    await DB.prepare('UPDATE ordres_mission_qualite SET reference = ? WHERE id = ?').bind(reference, missionId).run();
    
    return c.json({ 
      success: true, 
      mission: { id: missionId, reference, project_id, type_audit: type_audit || 'SOL' }
    }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur création mission', details: error.message }, 500);
  }
});

// GET /missions/:id - Détail mission
auditQualiteRoutes.get('/missions/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    
    const mission = await DB.prepare('SELECT * FROM v_aq_missions_stats WHERE id = ?').bind(id).first();
    if (!mission) return c.json({ error: 'Mission introuvable' }, 404);
    
    // Stats détaillées items
    const itemsSol = await DB.prepare(`
      SELECT conformite, COUNT(*) as count 
      FROM aq_checklist_items WHERE mission_id = ? 
      GROUP BY conformite
    `).bind(id).all();
    
    const itemsToiture = await DB.prepare(`
      SELECT conformite, COUNT(*) as count 
      FROM aq_checklist_items_toiture WHERE mission_id = ? 
      GROUP BY conformite
    `).bind(id).all();
    
    return c.json({ 
      success: true, 
      mission,
      stats: {
        sol: itemsSol.results,
        toiture: itemsToiture.results
      }
    });
  } catch (error: any) {
    return c.json({ error: 'Erreur détail mission', details: error.message }, 500);
  }
});

// PUT /missions/:id - Modifier mission
auditQualiteRoutes.put('/missions/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const fields: string[] = [];
    const values: any[] = [];
    
    const allowedFields = ['technicien_id', 'sous_traitant_id', 'type_audit', 'priorite', 'date_planifiee', 'meteo', 'temperature_ambiante', 'irradiance', 'commentaire_general', 'notes_internes', 'score_global'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }
    
    if (fields.length === 0) return c.json({ error: 'Aucun champ à modifier' }, 400);
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await DB.prepare(`UPDATE ordres_mission_qualite SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur modification mission', details: error.message }, 500);
  }
});

// DELETE /missions/:id
auditQualiteRoutes.delete('/missions/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    await DB.prepare('DELETE FROM ordres_mission_qualite WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur suppression mission', details: error.message }, 500);
  }
});

// PUT /missions/:id/statut - Changer statut
auditQualiteRoutes.put('/missions/:id/statut', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const { statut } = await c.req.json();
    
    const validStatuts = ['planifie', 'en_cours', 'termine', 'valide', 'annule'];
    if (!validStatuts.includes(statut)) return c.json({ error: `Statut invalide. Valeurs: ${validStatuts.join(', ')}` }, 400);
    
    const updates: string[] = ['statut = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [statut];
    
    if (statut === 'en_cours') { updates.push('date_debut = CURRENT_TIMESTAMP'); }
    if (statut === 'termine' || statut === 'valide') { updates.push('date_fin = CURRENT_TIMESTAMP'); }
    
    // Calculer score si terminé
    if (statut === 'termine') {
      const stats = await DB.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM aq_checklist_items WHERE mission_id = ? AND conformite != 'non_verifie') as verified_sol,
          (SELECT COUNT(*) FROM aq_checklist_items WHERE mission_id = ? AND conformite = 'conforme') as conforme_sol,
          (SELECT COUNT(*) FROM aq_checklist_items WHERE mission_id = ? AND conformite = 'non_conforme') as nc_sol,
          (SELECT COUNT(*) FROM aq_checklist_items WHERE mission_id = ? AND conformite = 'observation') as obs_sol,
          (SELECT COUNT(*) FROM aq_checklist_items_toiture WHERE mission_id = ? AND conformite != 'non_verifie') as verified_toi,
          (SELECT COUNT(*) FROM aq_checklist_items_toiture WHERE mission_id = ? AND conformite = 'conforme') as conforme_toi,
          (SELECT COUNT(*) FROM aq_checklist_items_toiture WHERE mission_id = ? AND conformite = 'non_conforme') as nc_toi,
          (SELECT COUNT(*) FROM aq_checklist_items_toiture WHERE mission_id = ? AND conformite = 'observation') as obs_toi
      `).bind(id, id, id, id, id, id, id, id).first();
      
      if (stats) {
        const totalVerified = (stats.verified_sol as number) + (stats.verified_toi as number);
        const totalConforme = (stats.conforme_sol as number) + (stats.conforme_toi as number);
        const totalNc = (stats.nc_sol as number) + (stats.nc_toi as number);
        const totalObs = (stats.obs_sol as number) + (stats.obs_toi as number);
        const score = totalVerified > 0 ? Math.round((totalConforme / totalVerified) * 100) : 0;
        
        updates.push('score_global = ?', 'nb_non_conformites = ?', 'nb_observations = ?', 'nb_conformes = ?');
        params.push(score, totalNc, totalObs, totalConforme);
      }
    }
    
    params.push(id);
    await DB.prepare(`UPDATE ordres_mission_qualite SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    
    return c.json({ success: true, statut });
  } catch (error: any) {
    return c.json({ error: 'Erreur changement statut', details: error.message }, 500);
  }
});

// ============================================================================
// CHECKLIST SOL (NF C 15-100)
// ============================================================================

// GET /missions/:id/checklist/sol
auditQualiteRoutes.get('/missions/:id/checklist/sol', async (c) => {
  try {
    const { DB } = c.env;
    const missionId = c.req.param('id');
    
    const items = await DB.prepare(`
      SELECT ci.*, 
        (SELECT COUNT(*) FROM aq_item_photos WHERE checklist_item_id = ci.id AND checklist_type = 'sol') as nb_photos
      FROM aq_checklist_items ci 
      WHERE ci.mission_id = ? 
      ORDER BY ci.ordre_affichage, ci.id
    `).bind(missionId).all();
    
    // Stats
    const stats = {
      total: items.results.length,
      conforme: items.results.filter((i: any) => i.conformite === 'conforme').length,
      non_conforme: items.results.filter((i: any) => i.conformite === 'non_conforme').length,
      observation: items.results.filter((i: any) => i.conformite === 'observation').length,
      non_applicable: items.results.filter((i: any) => i.conformite === 'non_applicable').length,
      non_verifie: items.results.filter((i: any) => i.conformite === 'non_verifie').length,
    };
    
    return c.json({ success: true, items: items.results, stats });
  } catch (error: any) {
    return c.json({ error: 'Erreur checklist SOL', details: error.message }, 500);
  }
});

// POST /missions/:id/checklist/sol/init - Initialiser les 36 items
auditQualiteRoutes.post('/missions/:id/checklist/sol/init', async (c) => {
  try {
    const { DB } = c.env;
    const missionId = c.req.param('id');
    
    // Vérifier si déjà initialisé
    const existing = await DB.prepare('SELECT COUNT(*) as count FROM aq_checklist_items WHERE mission_id = ?').bind(missionId).first();
    if (existing && (existing.count as number) > 0) {
      return c.json({ error: 'Checklist SOL déjà initialisée', count: existing.count }, 409);
    }
    
    // Insérer les 36 items
    const stmts = CHECKLIST_SOL_TEMPLATE.map((item, idx) => 
      DB.prepare(`
        INSERT INTO aq_checklist_items (mission_id, categorie, code_item, libelle, norme_reference, severite, ordre_affichage)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(missionId, item.categorie, item.code, item.libelle, item.norme, item.severite, idx + 1)
    );
    
    await DB.batch(stmts);
    
    return c.json({ success: true, items_created: CHECKLIST_SOL_TEMPLATE.length });
  } catch (error: any) {
    return c.json({ error: 'Erreur init checklist SOL', details: error.message }, 500);
  }
});

// PUT /checklist/sol/:itemId - MAJ conformité item SOL
auditQualiteRoutes.put('/checklist/sol/:itemId', async (c) => {
  try {
    const { DB } = c.env;
    const itemId = c.req.param('itemId');
    const { conformite, commentaire, severite, verifie_par } = await c.req.json();
    
    const validValues = ['conforme', 'non_conforme', 'observation', 'non_applicable', 'non_verifie'];
    if (conformite && !validValues.includes(conformite)) {
      return c.json({ error: `Valeur invalide. Options: ${validValues.join(', ')}` }, 400);
    }
    
    const fields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [];
    
    if (conformite !== undefined) { fields.push('conformite = ?'); params.push(conformite); }
    if (commentaire !== undefined) { fields.push('commentaire = ?'); params.push(commentaire); }
    if (severite !== undefined) { fields.push('severite = ?'); params.push(severite); }
    if (verifie_par !== undefined) { fields.push('verifie_par = ?'); params.push(verifie_par); }
    
    fields.push('verifie_at = CURRENT_TIMESTAMP');
    params.push(itemId);
    
    await DB.prepare(`UPDATE aq_checklist_items SET ${fields.join(', ')} WHERE id = ?`).bind(...params).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur MAJ item SOL', details: error.message }, 500);
  }
});

// ============================================================================
// CHECKLIST TOITURE (DTU 40.35)
// ============================================================================

// GET /missions/:id/checklist/toiture
auditQualiteRoutes.get('/missions/:id/checklist/toiture', async (c) => {
  try {
    const { DB } = c.env;
    const missionId = c.req.param('id');
    
    const items = await DB.prepare(`
      SELECT ct.*,
        (SELECT COUNT(*) FROM aq_item_photos WHERE checklist_item_id = ct.id AND checklist_type = 'toiture') as nb_photos
      FROM aq_checklist_items_toiture ct 
      WHERE ct.mission_id = ? 
      ORDER BY ct.ordre_affichage, ct.id
    `).bind(missionId).all();
    
    const stats = {
      total: items.results.length,
      conforme: items.results.filter((i: any) => i.conformite === 'conforme').length,
      non_conforme: items.results.filter((i: any) => i.conformite === 'non_conforme').length,
      observation: items.results.filter((i: any) => i.conformite === 'observation').length,
      non_applicable: items.results.filter((i: any) => i.conformite === 'non_applicable').length,
      non_verifie: items.results.filter((i: any) => i.conformite === 'non_verifie').length,
    };
    
    return c.json({ success: true, items: items.results, stats });
  } catch (error: any) {
    return c.json({ error: 'Erreur checklist toiture', details: error.message }, 500);
  }
});

// POST /missions/:id/checklist/toiture/init
auditQualiteRoutes.post('/missions/:id/checklist/toiture/init', async (c) => {
  try {
    const { DB } = c.env;
    const missionId = c.req.param('id');
    
    const existing = await DB.prepare('SELECT COUNT(*) as count FROM aq_checklist_items_toiture WHERE mission_id = ?').bind(missionId).first();
    if (existing && (existing.count as number) > 0) {
      return c.json({ error: 'Checklist toiture déjà initialisée', count: existing.count }, 409);
    }
    
    // Charger template
    const templates = await DB.prepare('SELECT * FROM aq_checklist_toiture_template WHERE actif = 1 ORDER BY ordre_affichage').all();
    
    if (!templates.results.length) {
      return c.json({ error: 'Aucun template toiture trouvé. Exécutez la migration 0060.' }, 500);
    }
    
    const stmts = templates.results.map((tpl: any) =>
      DB.prepare(`
        INSERT INTO aq_checklist_items_toiture (mission_id, template_item_id, categorie, code_item, libelle, norme_reference, severite, ordre_affichage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(missionId, tpl.id, tpl.categorie, tpl.code_item, tpl.libelle, tpl.norme_reference, tpl.severite_defaut, tpl.ordre_affichage)
    );
    
    await DB.batch(stmts);
    
    return c.json({ success: true, items_created: templates.results.length });
  } catch (error: any) {
    return c.json({ error: 'Erreur init checklist toiture', details: error.message }, 500);
  }
});

// PUT /checklist/toiture/:itemId
auditQualiteRoutes.put('/checklist/toiture/:itemId', async (c) => {
  try {
    const { DB } = c.env;
    const itemId = c.req.param('itemId');
    const { conformite, commentaire, severite, verifie_par } = await c.req.json();
    
    const validValues = ['conforme', 'non_conforme', 'observation', 'non_applicable', 'non_verifie'];
    if (conformite && !validValues.includes(conformite)) {
      return c.json({ error: `Valeur invalide` }, 400);
    }
    
    const fields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [];
    
    if (conformite !== undefined) { fields.push('conformite = ?'); params.push(conformite); }
    if (commentaire !== undefined) { fields.push('commentaire = ?'); params.push(commentaire); }
    if (severite !== undefined) { fields.push('severite = ?'); params.push(severite); }
    if (verifie_par !== undefined) { fields.push('verifie_par = ?'); params.push(verifie_par); }
    
    fields.push('verifie_at = CURRENT_TIMESTAMP');
    params.push(itemId);
    
    await DB.prepare(`UPDATE aq_checklist_items_toiture SET ${fields.join(', ')} WHERE id = ?`).bind(...params).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur MAJ item toiture', details: error.message }, 500);
  }
});

// ============================================================================
// PHOTOS ITEM
// ============================================================================

// GET /missions/:id/photos - Toutes photos d'une mission
auditQualiteRoutes.get('/missions/:id/photos', async (c) => {
  try {
    const { DB } = c.env;
    const missionId = c.req.param('id');
    
    const photos = await DB.prepare(`
      SELECT * FROM aq_item_photos WHERE mission_id = ? ORDER BY created_at DESC
    `).bind(missionId).all();
    
    return c.json({ success: true, photos: photos.results });
  } catch (error: any) {
    return c.json({ error: 'Erreur photos', details: error.message }, 500);
  }
});

// POST /checklist/:type/:itemId/photos - Upload photo pour item
auditQualiteRoutes.post('/checklist/:type/:itemId/photos', async (c) => {
  try {
    const { DB, R2 } = c.env;
    const type = c.req.param('type'); // 'sol' ou 'toiture'
    const itemId = c.req.param('itemId');
    
    // Récupérer mission_id depuis l'item
    const table = type === 'toiture' ? 'aq_checklist_items_toiture' : 'aq_checklist_items';
    const item = await DB.prepare(`SELECT mission_id FROM ${table} WHERE id = ?`).bind(itemId).first();
    if (!item) return c.json({ error: 'Item introuvable' }, 404);
    
    const body = await c.req.json();
    const { photo_url, photo_base64, legende, type_photo, latitude, longitude } = body;
    
    let finalUrl = photo_url;
    let r2Key = null;
    
    // Si base64, stocker sur R2
    if (photo_base64 && R2) {
      r2Key = `audit-qualite/${item.mission_id}/items/${type}-${itemId}/${Date.now()}.jpg`;
      const buffer = Uint8Array.from(atob(photo_base64), c => c.charCodeAt(0));
      await R2.put(r2Key, buffer, { httpMetadata: { contentType: 'image/jpeg' } });
      finalUrl = `/api/audit-qualite/r2/${r2Key}`;
    }
    
    if (!finalUrl) return c.json({ error: 'photo_url ou photo_base64 requis' }, 400);
    
    const result = await DB.prepare(`
      INSERT INTO aq_item_photos (checklist_item_id, checklist_type, mission_id, photo_url, photo_r2_key, legende, type_photo, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(itemId, type, item.mission_id, finalUrl, r2Key, legende || null, type_photo || 'defaut', latitude || null, longitude || null).run();
    
    return c.json({ success: true, photo_id: result.meta.last_row_id, url: finalUrl }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur upload photo', details: error.message }, 500);
  }
});

// DELETE /photos/:photoId
auditQualiteRoutes.delete('/photos/:photoId', async (c) => {
  try {
    const { DB, R2 } = c.env;
    const photoId = c.req.param('photoId');
    
    const photo = await DB.prepare('SELECT photo_r2_key FROM aq_item_photos WHERE id = ?').bind(photoId).first();
    if (photo?.photo_r2_key && R2) {
      await R2.delete(photo.photo_r2_key as string);
    }
    
    await DB.prepare('DELETE FROM aq_item_photos WHERE id = ?').bind(photoId).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur suppression photo', details: error.message }, 500);
  }
});

// GET /r2/* - Servir les photos R2
auditQualiteRoutes.get('/r2/*', async (c) => {
  try {
    const { R2 } = c.env;
    const key = c.req.path.replace('/api/audit-qualite/r2/', '');
    
    if (!R2) return c.json({ error: 'R2 non configuré' }, 500);
    
    const object = await R2.get(key);
    if (!object) return c.notFound();
    
    return new Response(object.body, {
      headers: { 'Content-Type': object.httpMetadata?.contentType || 'image/jpeg', 'Cache-Control': 'public, max-age=86400' }
    });
  } catch (error: any) {
    return c.json({ error: 'Erreur R2', details: error.message }, 500);
  }
});

// ============================================================================
// COMMENTAIRES FINAUX
// ============================================================================

// GET /missions/:id/commentaires
auditQualiteRoutes.get('/missions/:id/commentaires', async (c) => {
  try {
    const { DB } = c.env;
    const missionId = c.req.param('id');
    const result = await DB.prepare('SELECT * FROM aq_commentaires_finaux WHERE mission_id = ?').bind(missionId).first();
    return c.json({ success: true, commentaire: result || null });
  } catch (error: any) {
    return c.json({ error: 'Erreur commentaires', details: error.message }, 500);
  }
});

// POST /missions/:id/commentaires - Créer/MAJ (upsert)
auditQualiteRoutes.post('/missions/:id/commentaires', async (c) => {
  try {
    const { DB } = c.env;
    const missionId = c.req.param('id');
    const { conclusion_generale, recommandations, actions_correctives, signe_par, signature_data } = await c.req.json();
    
    // Upsert via INSERT OR REPLACE
    const existing = await DB.prepare('SELECT id FROM aq_commentaires_finaux WHERE mission_id = ?').bind(missionId).first();
    
    if (existing) {
      await DB.prepare(`
        UPDATE aq_commentaires_finaux SET 
          conclusion_generale = ?, recommandations = ?, actions_correctives = ?,
          signe_par = ?, signature_data = ?, 
          signe_le = CASE WHEN ? IS NOT NULL THEN CURRENT_TIMESTAMP ELSE signe_le END,
          updated_at = CURRENT_TIMESTAMP
        WHERE mission_id = ?
      `).bind(
        conclusion_generale || null, recommandations || null, 
        typeof actions_correctives === 'object' ? JSON.stringify(actions_correctives) : actions_correctives || null,
        signe_par || null, signature_data || null, signe_par || null, missionId
      ).run();
    } else {
      await DB.prepare(`
        INSERT INTO aq_commentaires_finaux (mission_id, conclusion_generale, recommandations, actions_correctives, signe_par, signature_data, signe_le)
        VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? IS NOT NULL THEN CURRENT_TIMESTAMP ELSE NULL END)
      `).bind(
        missionId, conclusion_generale || null, recommandations || null,
        typeof actions_correctives === 'object' ? JSON.stringify(actions_correctives) : actions_correctives || null,
        signe_par || null, signature_data || null, signe_par || null
      ).run();
    }
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur commentaires', details: error.message }, 500);
  }
});

// ============================================================================
// PHOTOS GÉNÉRALES
// ============================================================================

auditQualiteRoutes.get('/missions/:id/photos-generales', async (c) => {
  try {
    const { DB } = c.env;
    const missionId = c.req.param('id');
    const photos = await DB.prepare('SELECT * FROM aq_photos_generales WHERE mission_id = ? ORDER BY created_at DESC').bind(missionId).all();
    return c.json({ success: true, photos: photos.results });
  } catch (error: any) {
    return c.json({ error: 'Erreur photos générales', details: error.message }, 500);
  }
});

auditQualiteRoutes.post('/missions/:id/photos-generales', async (c) => {
  try {
    const { DB, R2 } = c.env;
    const missionId = c.req.param('id');
    const { photo_url, photo_base64, type_photo, legende, latitude, longitude } = await c.req.json();
    
    let finalUrl = photo_url;
    let r2Key = null;
    
    if (photo_base64 && R2) {
      r2Key = `audit-qualite/${missionId}/generales/${Date.now()}.jpg`;
      const buffer = Uint8Array.from(atob(photo_base64), c => c.charCodeAt(0));
      await R2.put(r2Key, buffer, { httpMetadata: { contentType: 'image/jpeg' } });
      finalUrl = `/api/audit-qualite/r2/${r2Key}`;
    }
    
    if (!finalUrl) return c.json({ error: 'photo_url ou photo_base64 requis' }, 400);
    
    const result = await DB.prepare(`
      INSERT INTO aq_photos_generales (mission_id, photo_url, photo_r2_key, type_photo, legende, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(missionId, finalUrl, r2Key, type_photo || 'vue_ensemble', legende || null, latitude || null, longitude || null).run();
    
    return c.json({ success: true, photo_id: result.meta.last_row_id }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur upload photo générale', details: error.message }, 500);
  }
});

auditQualiteRoutes.delete('/photos-generales/:photoId', async (c) => {
  try {
    const { DB, R2 } = c.env;
    const photoId = c.req.param('photoId');
    
    const photo = await DB.prepare('SELECT photo_r2_key FROM aq_photos_generales WHERE id = ?').bind(photoId).first();
    if (photo?.photo_r2_key && R2) {
      await R2.delete(photo.photo_r2_key as string);
    }
    
    await DB.prepare('DELETE FROM aq_photos_generales WHERE id = ?').bind(photoId).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur suppression', details: error.message }, 500);
  }
});

// ============================================================================
// RAPPORTS
// ============================================================================

// POST /missions/:id/rapport/generer
auditQualiteRoutes.post('/missions/:id/rapport/generer', async (c) => {
  try {
    const { DB } = c.env;
    const missionId = c.req.param('id');
    
    // Charger toutes les données
    const mission = await DB.prepare('SELECT * FROM v_aq_missions_stats WHERE id = ?').bind(missionId).first();
    if (!mission) return c.json({ error: 'Mission introuvable' }, 404);
    
    const itemsSol = await DB.prepare('SELECT * FROM aq_checklist_items WHERE mission_id = ? ORDER BY ordre_affichage').bind(missionId).all();
    const itemsToiture = await DB.prepare('SELECT * FROM aq_checklist_items_toiture WHERE mission_id = ? ORDER BY ordre_affichage').bind(missionId).all();
    const commentaire = await DB.prepare('SELECT * FROM aq_commentaires_finaux WHERE mission_id = ?').bind(missionId).first();
    const photosGen = await DB.prepare('SELECT * FROM aq_photos_generales WHERE mission_id = ?').bind(missionId).all();
    
    // Calculer stats
    const allItems = [...(itemsSol.results || []), ...(itemsToiture.results || [])];
    const totalItems = allItems.length;
    const conformes = allItems.filter((i: any) => i.conformite === 'conforme').length;
    const nonConformes = allItems.filter((i: any) => i.conformite === 'non_conforme').length;
    const observations = allItems.filter((i: any) => i.conformite === 'observation').length;
    const scoreConformite = totalItems > 0 ? Math.round((conformes / totalItems) * 100) : 0;
    
    // Générer référence rapport
    const existingRapport = await DB.prepare('SELECT id FROM aq_rapports WHERE mission_id = ?').bind(missionId).first();
    
    let rapportId;
    const now = new Date().toISOString();
    
    if (existingRapport) {
      // MAJ du rapport existant
      rapportId = existingRapport.id;
      await DB.prepare(`
        UPDATE aq_rapports SET 
          version = version + 1, statut = 'genere',
          score_conformite = ?, nb_non_conformites = ?, nb_observations = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(scoreConformite, nonConformes, observations, rapportId).run();
    } else {
      const result = await DB.prepare(`
        INSERT INTO aq_rapports (mission_id, titre, statut, score_conformite, nb_non_conformites, nb_observations)
        VALUES (?, ?, 'genere', ?, ?, ?)
      `).bind(
        missionId, 
        `Rapport Audit Qualité - ${mission.project_name || 'Centrale'}`,
        scoreConformite, nonConformes, observations
      ).run();
      rapportId = result.meta.last_row_id;
      
      const refRapport = generateReference('RAQ', rapportId as number);
      await DB.prepare('UPDATE aq_rapports SET reference = ? WHERE id = ?').bind(refRapport, rapportId).run();
    }
    
    const rapport = await DB.prepare('SELECT * FROM aq_rapports WHERE id = ?').bind(rapportId).first();
    
    return c.json({ 
      success: true, 
      rapport,
      data: {
        mission,
        items_sol: itemsSol.results,
        items_toiture: itemsToiture.results,
        commentaire,
        photos_generales: photosGen.results,
        stats: { totalItems, conformes, nonConformes, observations, scoreConformite }
      }
    });
  } catch (error: any) {
    return c.json({ error: 'Erreur génération rapport', details: error.message }, 500);
  }
});

// GET /rapports/:rapportId
auditQualiteRoutes.get('/rapports/:rapportId', async (c) => {
  try {
    const { DB } = c.env;
    const rapportId = c.req.param('rapportId');
    
    const rapport = await DB.prepare('SELECT * FROM aq_rapports WHERE id = ?').bind(rapportId).first();
    if (!rapport) return c.json({ error: 'Rapport introuvable' }, 404);
    
    // Charger données complètes
    const mission = await DB.prepare('SELECT * FROM v_aq_missions_stats WHERE id = ?').bind(rapport.mission_id).first();
    const itemsSol = await DB.prepare('SELECT * FROM aq_checklist_items WHERE mission_id = ? ORDER BY ordre_affichage').bind(rapport.mission_id).all();
    const itemsToiture = await DB.prepare('SELECT * FROM aq_checklist_items_toiture WHERE mission_id = ? ORDER BY ordre_affichage').bind(rapport.mission_id).all();
    const commentaire = await DB.prepare('SELECT * FROM aq_commentaires_finaux WHERE mission_id = ?').bind(rapport.mission_id).first();
    const photosGen = await DB.prepare('SELECT * FROM aq_photos_generales WHERE mission_id = ?').bind(rapport.mission_id).all();
    const complements = await DB.prepare('SELECT * FROM aq_rapports_complements WHERE rapport_id = ? ORDER BY ordre_affichage').bind(rapportId).all();
    
    return c.json({
      success: true,
      rapport,
      mission,
      items_sol: itemsSol.results,
      items_toiture: itemsToiture.results,
      commentaire,
      photos_generales: photosGen.results,
      complements: complements.results
    });
  } catch (error: any) {
    return c.json({ error: 'Erreur rapport', details: error.message }, 500);
  }
});

// PUT /rapports/:rapportId/valider
auditQualiteRoutes.put('/rapports/:rapportId/valider', async (c) => {
  try {
    const { DB } = c.env;
    const rapportId = c.req.param('rapportId');
    const { valide_par } = await c.req.json();
    
    await DB.prepare(`
      UPDATE aq_rapports SET statut = 'valide', valide_par = ?, valide_le = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(valide_par || 'Adrien PAPPALARDO', rapportId).run();
    
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur validation', details: error.message }, 500);
  }
});

// ============================================================================
// STATS & KPI
// ============================================================================

// GET /stats - Stats globales
auditQualiteRoutes.get('/stats', async (c) => {
  try {
    const { DB } = c.env;
    
    const stats = await DB.prepare(`
      SELECT
        COUNT(*) as total_missions,
        SUM(CASE WHEN statut = 'planifie' THEN 1 ELSE 0 END) as planifiees,
        SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END) as en_cours,
        SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END) as terminees,
        SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as validees,
        SUM(CASE WHEN statut = 'annule' THEN 1 ELSE 0 END) as annulees,
        AVG(CASE WHEN score_global IS NOT NULL THEN score_global END) as score_moyen,
        SUM(nb_non_conformites) as total_nc,
        SUM(nb_observations) as total_obs,
        SUM(nb_conformes) as total_conformes,
        SUM(CASE WHEN type_audit = 'SOL' THEN 1 ELSE 0 END) as missions_sol,
        SUM(CASE WHEN type_audit = 'TOITURE' THEN 1 ELSE 0 END) as missions_toiture,
        SUM(CASE WHEN type_audit = 'DOUBLE' THEN 1 ELSE 0 END) as missions_double
      FROM ordres_mission_qualite
    `).first();
    
    return c.json({ success: true, stats });
  } catch (error: any) {
    return c.json({ error: 'Erreur stats', details: error.message }, 500);
  }
});

// GET /stats/kpi - KPI compact pour dashboard CRM
auditQualiteRoutes.get('/stats/kpi', async (c) => {
  try {
    const { DB } = c.env;
    
    const kpi = await DB.prepare(`
      SELECT
        COUNT(*) as total_missions,
        SUM(CASE WHEN statut IN ('planifie', 'en_cours') THEN 1 ELSE 0 END) as missions_actives,
        SUM(CASE WHEN statut = 'termine' OR statut = 'valide' THEN 1 ELSE 0 END) as missions_terminees,
        ROUND(AVG(CASE WHEN score_global IS NOT NULL THEN score_global END), 1) as score_moyen,
        SUM(COALESCE(nb_non_conformites, 0)) as total_nc
      FROM ordres_mission_qualite
    `).first();
    
    // Missions récentes
    const recentes = await DB.prepare(`
      SELECT omq.id, omq.reference, omq.type_audit, omq.statut, omq.score_global, omq.date_planifiee,
        p.name as project_name, cc.company_name as client_name
      FROM ordres_mission_qualite omq
      LEFT JOIN projects p ON omq.project_id = p.id
      LEFT JOIN crm_clients cc ON omq.client_id = cc.id
      ORDER BY omq.created_at DESC LIMIT 5
    `).all();
    
    return c.json({ success: true, kpi, recentes: recentes.results });
  } catch (error: any) {
    return c.json({ error: 'Erreur KPI', details: error.message }, 500);
  }
});

// ============================================================================
// SOUS-TRAITANTS
// ============================================================================

auditQualiteRoutes.get('/sous-traitants', async (c) => {
  try {
    const { DB } = c.env;
    const { statut } = c.req.query();
    let query = 'SELECT * FROM sous_traitants';
    const params: any[] = [];
    if (statut) { query += ' WHERE statut = ?'; params.push(statut); }
    query += ' ORDER BY nom';
    const result = params.length ? await DB.prepare(query).bind(...params).all() : await DB.prepare(query).all();
    return c.json({ success: true, sous_traitants: result.results });
  } catch (error: any) {
    return c.json({ error: 'Erreur sous-traitants', details: error.message }, 500);
  }
});

auditQualiteRoutes.post('/sous-traitants', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json();
    const { nom, siret, contact_nom, contact_email, contact_telephone, specialite, zone_intervention, notes } = body;
    if (!nom) return c.json({ error: 'nom requis' }, 400);
    
    const result = await DB.prepare(`
      INSERT INTO sous_traitants (nom, siret, contact_nom, contact_email, contact_telephone, specialite, zone_intervention, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(nom, siret || null, contact_nom || null, contact_email || null, contact_telephone || null, specialite || null, zone_intervention || null, notes || null).run();
    
    return c.json({ success: true, id: result.meta.last_row_id }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur création sous-traitant', details: error.message }, 500);
  }
});

auditQualiteRoutes.put('/sous-traitants/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    const fields: string[] = [];
    const values: any[] = [];
    
    for (const key of ['nom', 'siret', 'contact_nom', 'contact_email', 'contact_telephone', 'specialite', 'zone_intervention', 'statut', 'notes']) {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
    }
    if (!fields.length) return c.json({ error: 'Aucun champ' }, 400);
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    await DB.prepare(`UPDATE sous_traitants SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur modification', details: error.message }, 500);
  }
});

// ============================================================================
// TECHNICIENS
// ============================================================================

auditQualiteRoutes.get('/techniciens', async (c) => {
  try {
    const { DB } = c.env;
    const { statut, sous_traitant_id } = c.req.query();
    let query = `SELECT t.*, COALESCE(st.nom, 'DiagPV (interne)') as sous_traitant_name FROM techniciens t LEFT JOIN sous_traitants st ON t.sous_traitant_id = st.id WHERE 1=1`;
    const params: any[] = [];
    if (statut) { query += ' AND t.statut = ?'; params.push(statut); }
    if (sous_traitant_id) { query += ' AND t.sous_traitant_id = ?'; params.push(sous_traitant_id); }
    query += ' ORDER BY t.nom, t.prenom';
    const result = params.length ? await DB.prepare(query).bind(...params).all() : await DB.prepare(query).all();
    return c.json({ success: true, techniciens: result.results });
  } catch (error: any) {
    return c.json({ error: 'Erreur techniciens', details: error.message }, 500);
  }
});

auditQualiteRoutes.post('/techniciens', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json();
    const { sous_traitant_id, nom, prenom, email, telephone, qualification, certifications, notes } = body;
    if (!nom || !prenom) return c.json({ error: 'nom et prenom requis' }, 400);
    
    const result = await DB.prepare(`
      INSERT INTO techniciens (sous_traitant_id, nom, prenom, email, telephone, qualification, certifications, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sous_traitant_id || null, nom, prenom, email || null, telephone || null, 
      qualification || null, Array.isArray(certifications) ? JSON.stringify(certifications) : certifications || null, 
      notes || null
    ).run();
    
    return c.json({ success: true, id: result.meta.last_row_id }, 201);
  } catch (error: any) {
    return c.json({ error: 'Erreur création technicien', details: error.message }, 500);
  }
});

auditQualiteRoutes.put('/techniciens/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    const fields: string[] = [];
    const values: any[] = [];
    
    for (const key of ['sous_traitant_id', 'nom', 'prenom', 'email', 'telephone', 'qualification', 'certifications', 'statut', 'notes']) {
      if (body[key] !== undefined) { 
        fields.push(`${key} = ?`); 
        values.push(key === 'certifications' && Array.isArray(body[key]) ? JSON.stringify(body[key]) : body[key]); 
      }
    }
    if (!fields.length) return c.json({ error: 'Aucun champ' }, 400);
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    await DB.prepare(`UPDATE techniciens SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Erreur modification', details: error.message }, 500);
  }
});

export default auditQualiteRoutes;
