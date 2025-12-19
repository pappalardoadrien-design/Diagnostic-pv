/**
 * Module CRM - Routes API
 * 
 * Endpoints:
 * - GET /api/crm/clients - Liste tous les clients
 * - POST /api/crm/clients - Créer un client
 * - GET /api/crm/clients/:id - Détails client + contacts
 * - PUT /api/crm/clients/:id - Modifier client
 * - DELETE /api/crm/clients/:id - Supprimer client
 * - GET /api/crm/clients/:id/audits - Audits du client
 * - POST /api/crm/contacts - Créer un contact
 * - PUT /api/crm/contacts/:id - Modifier contact
 * - DELETE /api/crm/contacts/:id - Supprimer contact
 */

import { Hono } from 'hono';
import type { 
  Bindings, 
  CrmClient,
  CrmContact,
  CreateClientRequest,
  UpdateClientRequest,
  CreateContactRequest,
  UpdateContactRequest,
  ClientWithStats
} from './types';

const crmRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// GET /api/crm/clients - Liste clients avec stats
// ============================================================================
crmRoutes.get('/clients', async (c) => {
  try {
    const { DB } = c.env;
    const { status, search } = c.req.query();

    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT a.id) as total_audits,
        MAX(a.created_at) as last_audit_date,
        COUNT(DISTINCT ct.id) as contacts_count
      FROM crm_clients c
      LEFT JOIN audits a ON a.client_id = c.id
      LEFT JOIN crm_contacts ct ON ct.client_id = c.id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(c.company_name LIKE ? OR c.city LIKE ? OR c.main_contact_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY c.id ORDER BY c.company_name ASC';

    const stmt = DB.prepare(query);
    const result = await stmt.bind(...params).all();

    return c.json({
      success: true,
      clients: result.results as ClientWithStats[],
      total: result.results.length
    });

  } catch (error: any) {
    console.error('GET /clients error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// POST /api/crm/clients - Créer un client
// ============================================================================
crmRoutes.post('/clients', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json<CreateClientRequest>();

    if (!body.company_name) {
      return c.json({ success: false, message: 'Nom entreprise requis' }, 400);
    }

    const result = await DB.prepare(`
      INSERT INTO crm_clients (
        company_name, client_type, siret, tva_number, address, postal_code, 
        city, country, main_contact_name, main_contact_email, main_contact_phone,
        status, acquisition_source, assigned_to, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.company_name,
      body.client_type || 'professional',
      body.siret || null,
      body.tva_number || null,
      body.address || null,
      body.postal_code || null,
      body.city || null,
      body.country || 'France',
      body.main_contact_name || null,
      body.main_contact_email || null,
      body.main_contact_phone || null,
      body.status || 'active',
      body.acquisition_source || null,
      body.assigned_to || null,
      body.notes || null
    ).run();

    return c.json({
      success: true,
      message: 'Client créé',
      client_id: result.meta.last_row_id
    }, 201);

  } catch (error: any) {
    console.error('POST /clients error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// GET /api/crm/clients/:id - Détails client + contacts
// ============================================================================
crmRoutes.get('/clients/:id', async (c) => {
  try {
    const { DB } = c.env;
    const clientId = c.req.param('id');

    // Récupérer client
    const client = await DB.prepare('SELECT * FROM crm_clients WHERE id = ?')
      .bind(clientId)
      .first();

    if (!client) {
      return c.json({ success: false, message: 'Client introuvable' }, 404);
    }

    // Récupérer contacts
    const contacts = await DB.prepare('SELECT * FROM crm_contacts WHERE client_id = ? ORDER BY is_primary DESC, last_name ASC')
      .bind(clientId)
      .all();

    // Stats audits
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_audits,
        MAX(created_at) as last_audit_date
      FROM audits 
      WHERE client_id = ?
    `).bind(clientId).first();

    return c.json({
      success: true,
      client: client as CrmClient,
      contacts: contacts.results as CrmContact[],
      stats: stats || { total_audits: 0, last_audit_date: null }
    });

  } catch (error: any) {
    console.error('GET /clients/:id error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// PUT /api/crm/clients/:id - Modifier client
// ============================================================================
crmRoutes.put('/clients/:id', async (c) => {
  try {
    const { DB } = c.env;
    const clientId = c.req.param('id');
    const body = await c.req.json<UpdateClientRequest>();

    const fields: string[] = [];
    const params: any[] = [];

    if (body.company_name !== undefined) {
      fields.push('company_name = ?');
      params.push(body.company_name);
    }
    if (body.client_type !== undefined) {
      fields.push('client_type = ?');
      params.push(body.client_type);
    }
    if (body.siret !== undefined) {
      fields.push('siret = ?');
      params.push(body.siret);
    }
    if (body.address !== undefined) {
      fields.push('address = ?');
      params.push(body.address);
    }
    if (body.city !== undefined) {
      fields.push('city = ?');
      params.push(body.city);
    }
    if (body.status !== undefined) {
      fields.push('status = ?');
      params.push(body.status);
    }
    if (body.notes !== undefined) {
      fields.push('notes = ?');
      params.push(body.notes);
    }

    if (fields.length === 0) {
      return c.json({ success: false, message: 'Aucune modification' }, 400);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(clientId);

    await DB.prepare(`UPDATE crm_clients SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    return c.json({ success: true, message: 'Client modifié' });

  } catch (error: any) {
    console.error('PUT /clients/:id error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// DELETE /api/crm/clients/:id - Supprimer client
// ============================================================================
crmRoutes.delete('/clients/:id', async (c) => {
  try {
    const { DB } = c.env;
    const clientId = c.req.param('id');

    // Vérifier si audits liés
    const audits = await DB.prepare('SELECT COUNT(*) as count FROM audits WHERE client_id = ?')
      .bind(clientId)
      .first() as any;

    if (audits.count > 0) {
      return c.json({ 
        success: false, 
        message: `Impossible de supprimer : ${audits.count} audit(s) lié(s)` 
      }, 400);
    }

    await DB.prepare('DELETE FROM crm_clients WHERE id = ?')
      .bind(clientId)
      .run();

    return c.json({ success: true, message: 'Client supprimé' });

  } catch (error: any) {
    console.error('DELETE /clients/:id error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// GET /api/crm/clients/:id/projects - Projets du client
// ============================================================================
crmRoutes.get('/clients/:id/projects', async (c) => {
  try {
    const { DB } = c.env;
    const clientId = c.req.param('id');

    const projects = await DB.prepare(`
      SELECT * FROM projects 
      WHERE client_id = ?
      ORDER BY created_at DESC
    `).bind(clientId).all();

    return c.json({
      success: true,
      projects: projects.results,
      total: projects.results.length
    });

  } catch (error: any) {
    console.error('GET /clients/:id/projects error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// GET /api/crm/clients/:id/audits - Audits du client
// ============================================================================
crmRoutes.get('/clients/:id/audits', async (c) => {
  try {
    const { DB } = c.env;
    const clientId = c.req.param('id');

    const audits = await DB.prepare(`
      SELECT 
        a.id as audit_id,
        a.audit_token,
        a.project_name,
        a.location,
        a.modules_enabled,
        a.status,
        a.created_at,
        a.updated_at,
        e.total_modules
      FROM audits a
      LEFT JOIN el_audits e ON a.id = e.audit_id
      WHERE a.client_id = ?
      ORDER BY a.created_at DESC
    `).bind(clientId).all();

    return c.json({
      success: true,
      audits: audits.results,
      total: audits.results.length
    });

  } catch (error: any) {
    console.error('GET /clients/:id/audits error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// POST /api/crm/contacts - Créer un contact
// ============================================================================
crmRoutes.post('/contacts', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json<CreateContactRequest>();

    if (!body.client_id || !body.first_name || !body.last_name) {
      return c.json({ success: false, message: 'client_id, first_name et last_name requis' }, 400);
    }

    const result = await DB.prepare(`
      INSERT INTO crm_contacts (
        client_id, first_name, last_name, role, department, email, phone, mobile,
        is_primary, receive_reports, receive_invoices, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.client_id,
      body.first_name,
      body.last_name,
      body.role || null,
      body.department || null,
      body.email || null,
      body.phone || null,
      body.mobile || null,
      body.is_primary ? 1 : 0,
      body.receive_reports !== false ? 1 : 0,
      body.receive_invoices ? 1 : 0,
      body.notes || null
    ).run();

    return c.json({
      success: true,
      message: 'Contact créé',
      contact_id: result.meta.last_row_id
    }, 201);

  } catch (error: any) {
    console.error('POST /contacts error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// PUT /api/crm/contacts/:id - Modifier contact
// ============================================================================
crmRoutes.put('/contacts/:id', async (c) => {
  try {
    const { DB } = c.env;
    const contactId = c.req.param('id');
    const body = await c.req.json<UpdateContactRequest>();

    const fields: string[] = [];
    const params: any[] = [];

    if (body.first_name !== undefined) {
      fields.push('first_name = ?');
      params.push(body.first_name);
    }
    if (body.last_name !== undefined) {
      fields.push('last_name = ?');
      params.push(body.last_name);
    }
    if (body.role !== undefined) {
      fields.push('role = ?');
      params.push(body.role);
    }
    if (body.email !== undefined) {
      fields.push('email = ?');
      params.push(body.email);
    }
    if (body.phone !== undefined) {
      fields.push('phone = ?');
      params.push(body.phone);
    }
    if (body.is_primary !== undefined) {
      fields.push('is_primary = ?');
      params.push(body.is_primary ? 1 : 0);
    }

    if (fields.length === 0) {
      return c.json({ success: false, message: 'Aucune modification' }, 400);
    }

    params.push(contactId);

    await DB.prepare(`UPDATE crm_contacts SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    return c.json({ success: true, message: 'Contact modifié' });

  } catch (error: any) {
    console.error('PUT /contacts/:id error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// DELETE /api/crm/contacts/:id - Supprimer contact
// ============================================================================
crmRoutes.delete('/contacts/:id', async (c) => {
  try {
    const { DB } = c.env;
    const contactId = c.req.param('id');

    await DB.prepare('DELETE FROM crm_contacts WHERE id = ?')
      .bind(contactId)
      .run();

    return c.json({ success: true, message: 'Contact supprimé' });

  } catch (error: any) {
    console.error('DELETE /contacts/:id error:', error);
    return c.json({ success: false, message: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// PROJECTS / SITES ROUTES
// ============================================================================

// GET /api/crm/projects - Liste tous les projets/sites
crmRoutes.get('/projects', async (c) => {
  try {
    const { DB } = c.env;
    
    const result = await DB.prepare(`
      SELECT *, name as project_name FROM projects ORDER BY created_at DESC
    `).all();

    return c.json({
      success: true,
      projects: result.results
    });

  } catch (error: any) {
    console.error('GET /projects error:', error);
    return c.json({ success: false, error: 'Erreur serveur' }, 500);
  }
});

// GET /api/crm/projects/:id - Détails projet
crmRoutes.get('/projects/:id', async (c) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');

    const project = await DB.prepare(`
      SELECT *, name as project_name FROM projects WHERE id = ?
    `).bind(projectId).first();

    if (!project) {
      return c.json({ success: false, error: 'Projet non trouvé' }, 404);
    }

    return c.json({
      success: true,
      project
    });

  } catch (error: any) {
    console.error('GET /projects/:id error:', error);
    return c.json({ success: false, error: 'Erreur serveur' }, 500);
  }
});

// GET /api/crm/clients/:id/projects - Liste projets d'un client
crmRoutes.get('/clients/:id/projects', async (c) => {
  try {
    const { DB } = c.env;
    const clientId = c.req.param('id');

    const result = await DB.prepare(`
      SELECT *, name as project_name FROM projects WHERE client_id = ? ORDER BY created_at DESC
    `).bind(clientId).all();

    return c.json({
      success: true,
      projects: result.results
    });

  } catch (error: any) {
    console.error('GET /clients/:id/projects error:', error);
    return c.json({ success: false, error: 'Erreur serveur' }, 500);
  }
});

// POST /api/crm/projects - Créer un projet/site
crmRoutes.post('/projects', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json();

    if (!body.client_id || !body.project_name) {
      return c.json({ success: false, error: 'client_id et project_name requis' }, 400);
    }

    try {
      // TENTATIVE 1: Insertion complète avec nouvelles colonnes (Migration 0027)
      // Cette requête échouera si la migration n'est pas appliquée sur la prod
      const result = await DB.prepare(`
        INSERT INTO projects (
          client_id, name, total_power_kwp, module_count, module_type,
          inverter_type, installation_date, status,
          address_street, address_postal_code, address_city,
          gps_latitude, gps_longitude, notes,
          inverter_count, inverter_brand, junction_box_count,
          strings_configuration, technical_notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        body.client_id,
        body.project_name,
        body.total_power_kwp,
        body.module_count,
        body.module_type,
        body.inverter_type,
        body.installation_date,
        body.status || 'active',
        body.address_street,
        body.address_postal_code,
        body.address_city,
        body.gps_latitude,
        body.gps_longitude,
        body.notes,
        body.inverter_count,
        body.inverter_brand,
        body.junction_box_count,
        body.strings_configuration,
        body.technical_notes
      ).run();

      // Créer automatiquement la Zone 1 par défaut
      await env.DB.prepare(`
        INSERT INTO pv_zones (
          plant_id, zone_name, zone_type, zone_order, azimuth, tilt
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        result.meta.last_row_id,
        'Zone 1 (Défaut)',
        'rooftop',
        1,
        180,
        30
      ).run()

      return c.json({
        success: true,
        project,
        message: 'Projet créé avec succès (Zone 1 initialisée)'
      });

    } catch (dbError: any) {
      // SI ECHEC TENTATIVE 1 (probablement colonne manquante car migration non appliquée)
      console.warn('Echec insertion complète, tentative mode compatibilité:', dbError.message);
      
      // On sauvegarde la config dans les notes pour ne pas la perdre
      const backupConfig = {
        inverter_count: body.inverter_count,
        inverter_brand: body.inverter_brand,
        junction_box_count: body.junction_box_count,
        strings_configuration: body.strings_configuration,
        technical_notes: body.technical_notes,
        // Sauvegarde des champs "modernes" qui pourraient échouer
        address_street: body.address_street,
        address_postal_code: body.address_postal_code,
        address_city: body.address_city,
        total_power_kwp: body.total_power_kwp,
        module_count: body.module_count,
        module_type: body.module_type,
        inverter_type: body.inverter_type
      };
      
      const enrichedNotes = (body.notes || '') + '\n\n[MIGRATION_PENDING_DATA]\n' + JSON.stringify(backupConfig);

      try {
        // TENTATIVE 2: Insertion compatible avec schéma intermédiaire (colonnes "modernes" manquantes mais base présente)
        // Note: Le schéma 0004 utilise des noms différents (installation_power vs total_power_kwp)
        // Cette tentative essaie d'abord les colonnes "modernes" de base
        const resultFallback = await DB.prepare(`
          INSERT INTO projects (
            client_id, name, total_power_kwp, module_count, module_type,
            inverter_type, installation_date, status,
            address_street, address_postal_code, address_city,
            gps_latitude, gps_longitude, notes,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          body.client_id,
          body.project_name,
          body.total_power_kwp,
          body.module_count,
          body.module_type,
          body.inverter_type,
          body.installation_date,
          body.status || 'active',
          body.address_street,
          body.address_postal_code,
          body.address_city,
          body.gps_latitude,
          body.gps_longitude,
          enrichedNotes
        ).run();

        const projectFallback = await DB.prepare('SELECT * FROM projects WHERE id = ?')
          .bind(resultFallback.meta.last_row_id)
          .first();

        return c.json({
          success: true,
          project: projectFallback,
          message: 'Projet créé (Mode compatibilité - Migrations partielles)',
          warning: 'DATABASE_MIGRATION_REQUIRED'
        });

      } catch (fallbackError: any) {
        // TENTATIVE 3: ULTIMATE FALLBACK (Schéma 0004 "Legacy")
        // Mappe les champs modernes vers les anciens champs (installation_power, etc.)
        console.warn('Echec Tentative 2, passage en mode Legacy 0004:', fallbackError.message);

        const siteAddress = [body.address_street, body.address_postal_code, body.address_city].filter(Boolean).join(', ');

        const resultLegacy = await DB.prepare(`
          INSERT INTO projects (
            client_id, name, site_address, 
            installation_power, total_modules, module_model, inverter_model,
            installation_date, 
            latitude, longitude, 
            notes,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          body.client_id,
          body.project_name,
          siteAddress || 'Non renseigné',
          body.total_power_kwp,     // Map total_power_kwp -> installation_power
          body.module_count,        // Map module_count -> total_modules
          body.module_type,         // Map module_type -> module_model
          body.inverter_type,       // Map inverter_type -> inverter_model
          body.installation_date,
          body.gps_latitude,        // Map gps_latitude -> latitude
          body.gps_longitude,       // Map gps_longitude -> longitude
          enrichedNotes
        ).run();

        const projectLegacy = await DB.prepare('SELECT * FROM projects WHERE id = ?')
          .bind(resultLegacy.meta.last_row_id)
          .first();

        return c.json({
          success: true,
          project: projectLegacy,
          message: 'Projet créé (Mode Legacy 0004 - Schéma ancien détecté)',
          warning: 'CRITICAL_DATABASE_MIGRATION_REQUIRED'
        });
      }
    }

  } catch (error: any) {
    console.error('POST /projects error:', error);
    return c.json({ success: false, error: 'Erreur serveur: ' + error.message }, 500);
  }
});

// PUT /api/crm/projects/:id - Modifier un projet
crmRoutes.put('/projects/:id', async (c) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');
    const body = await c.req.json();

    // Fonction pour construire la requête (avec ou sans les nouvelles colonnes)
    const buildQuery = (excludeNewColumns = false) => {
      const fields = [];
      const values = [];

      if (body.audit_types !== undefined) {
        fields.push('audit_types = ?');
        values.push(body.audit_types);
      }
      if (body.project_name !== undefined) {
        fields.push('name = ?');
        values.push(body.project_name);
      }
      if (body.total_power_kwp !== undefined) {
        fields.push('total_power_kwp = ?');
        values.push(body.total_power_kwp);
      }
      if (body.module_count !== undefined) {
        fields.push('module_count = ?');
        values.push(body.module_count);
      }
      if (body.module_type !== undefined) {
        fields.push('module_type = ?');
        values.push(body.module_type);
      }
      if (body.inverter_type !== undefined) {
        fields.push('inverter_type = ?');
        values.push(body.inverter_type);
      }
      if (body.installation_date !== undefined) {
        fields.push('installation_date = ?');
        values.push(body.installation_date);
      }
      if (body.status !== undefined) {
        fields.push('status = ?');
        values.push(body.status);
      }
      if (body.address_street !== undefined) {
        fields.push('address_street = ?');
        values.push(body.address_street);
      }
      if (body.address_postal_code !== undefined) {
        fields.push('address_postal_code = ?');
        values.push(body.address_postal_code);
      }
      if (body.address_city !== undefined) {
        fields.push('address_city = ?');
        values.push(body.address_city);
      }
      if (body.gps_latitude !== undefined) {
        fields.push('gps_latitude = ?');
        values.push(body.gps_latitude);
      }
      if (body.gps_longitude !== undefined) {
        fields.push('gps_longitude = ?');
        values.push(body.gps_longitude);
      }
      if (body.notes !== undefined) {
        fields.push('notes = ?');
        values.push(body.notes);
      }
      
      // Nouvelles colonnes (Migration 0027)
      if (!excludeNewColumns) {
        if (body.inverter_count !== undefined) {
          fields.push('inverter_count = ?');
          values.push(body.inverter_count);
        }
        if (body.inverter_brand !== undefined) {
          fields.push('inverter_brand = ?');
          values.push(body.inverter_brand);
        }
        if (body.junction_box_count !== undefined) {
          fields.push('junction_box_count = ?');
          values.push(body.junction_box_count);
        }
        if (body.strings_configuration !== undefined) {
          fields.push('strings_configuration = ?');
          values.push(body.strings_configuration);
        }
        if (body.technical_notes !== undefined) {
          fields.push('technical_notes = ?');
          values.push(body.technical_notes);
        }
      }

      return { fields, values };
    };

    // Tentative 1: Update complet
    let { fields, values } = buildQuery(false);

    if (fields.length === 0) {
      return c.json({ success: false, error: 'Aucune modification fournie' }, 400);
    }

    try {
      fields.push('updated_at = datetime(\'now\')');
      values.push(projectId);

      await DB.prepare(`
        UPDATE projects SET ${fields.join(', ')} WHERE id = ?
      `).bind(...values).run();
      
      return c.json({
        success: true,
        message: 'Projet modifié avec succès'
      });
      
    } catch (dbError: any) {
      // Tentative 2: Mode compatibilité (sans nouvelles colonnes)
      console.warn('Update failed (T1), retrying without new columns:', dbError.message);
      
      try {
        const fallback = buildQuery(true);
        fields = fallback.fields;
        values = fallback.values;
        
        if (fields.length > 0) {
          fields.push('updated_at = datetime(\'now\')');
          values.push(projectId);
          
          await DB.prepare(`
            UPDATE projects SET ${fields.join(', ')} WHERE id = ?
          `).bind(...values).run();
        }
        
        return c.json({ 
          success: true, 
          message: 'Projet modifié (Mode compatibilité - Warning: Database Schema mismatch)',
          warning: 'DATABASE_MIGRATION_REQUIRED'
        });

      } catch (fallbackError: any) {
        // Tentative 3: Mode Legacy 0004 (Anciens noms de colonnes)
        console.warn('Update failed (T2), retrying Legacy Mode 0004:', fallbackError.message);

        const legacyFields = [];
        const legacyValues = [];

        // Mapping manuel
        const map: Record<string, string> = {
            'project_name': 'name',
            'total_power_kwp': 'installation_power',
            'module_count': 'total_modules',
            'module_type': 'module_model',
            'inverter_type': 'inverter_model',
            'gps_latitude': 'latitude',
            'gps_longitude': 'longitude',
            'installation_date': 'installation_date',
            'notes': 'notes'
        };

        for (const [bodyKey, dbCol] of Object.entries(map)) {
            if (body[bodyKey] !== undefined) {
                legacyFields.push(`${dbCol} = ?`);
                legacyValues.push(body[bodyKey]);
            }
        }

        // Special handling for address (concaténation best-effort)
        if (body.address_street || body.address_postal_code || body.address_city) {
            const parts = [body.address_street, body.address_postal_code, body.address_city].filter(Boolean);
            if (parts.length > 0) {
                legacyFields.push('site_address = ?');
                legacyValues.push(parts.join(', '));
            }
        }

        if (legacyFields.length === 0) {
             // Si on a essayé de modifier que des colonnes non supportées par Legacy
             return c.json({ success: true, message: 'Modification ignorée (Incompatible Legacy DB)' });
        }

        legacyFields.push("updated_at = datetime('now')");
        legacyValues.push(projectId);

        await DB.prepare(`UPDATE projects SET ${legacyFields.join(', ')} WHERE id = ?`)
            .bind(...legacyValues).run();

        return c.json({
            success: true,
            message: 'Projet modifié (Mode Legacy 0004)',
            warning: 'CRITICAL_DATABASE_MIGRATION_REQUIRED'
        });
      }
    }

  } catch (error: any) {
    console.error('PUT /projects/:id error:', error);
    return c.json({ success: false, error: 'Erreur serveur' }, 500);
  }
});

// DELETE /api/crm/projects/:id - Supprimer un projet
crmRoutes.delete('/projects/:id', async (c) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');

    await DB.prepare('DELETE FROM projects WHERE id = ?')
      .bind(projectId)
      .run();

    return c.json({
      success: true,
      message: 'Projet supprimé avec succès'
    });

  } catch (error: any) {
    console.error('DELETE /projects/:id error:', error);
    return c.json({ success: false, error: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// GET /api/crm/dashboard/unified/summary - KPI Dashboard
// ============================================================================
crmRoutes.get('/dashboard/unified/summary', async (c) => {
  try {
    const { DB } = c.env;

    // Helper pour sécuriser les compteurs
    const safeCount = async (query: string, params: any[] = []) => {
      try {
        const res = await DB.prepare(query).bind(...params).first<{count: number}>();
        return res?.count || 0;
      } catch (e) {
        console.warn(`KPI Error (${query}):`, e);
        return 0;
      }
    };

    // 1. KPI (Sécurisés)
    const clientsCount = await safeCount('SELECT COUNT(*) as count FROM crm_clients WHERE status = "active"');
    const projectsCount = await safeCount('SELECT COUNT(*) as count FROM projects WHERE status = "active"');
    const auditsCount = await safeCount('SELECT COUNT(*) as count FROM audits WHERE status = "in_progress"');
    
    // Interventions cette semaine
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const interventionsCount = await safeCount(`
      SELECT COUNT(*) as count FROM interventions 
      WHERE intervention_date >= ? AND intervention_date <= ? AND status != "cancelled"
    `, [today, nextWeek]);

    // Défauts critiques (EL)
    const criticalDefects = await safeCount('SELECT COUNT(*) as count FROM el_modules WHERE severity_level >= 3');

    // 2. AUDITS RÉCENTS (5)
    let recentAudits = [];
    try {
      const res = await DB.prepare(`
        SELECT a.*, c.company_name as client_company
        FROM audits a
        LEFT JOIN crm_clients c ON a.client_id = c.id
        WHERE a.status = "in_progress"
        ORDER BY a.updated_at DESC
        LIMIT 5
      `).all();
      recentAudits = res.results || [];
    } catch (e) { console.warn('Recent Audits Error:', e); }

    // 3. INTERVENTIONS PROCHAINES (5)
    let upcomingInterventions = [];
    try {
      const res = await DB.prepare(`
        SELECT i.*, p.name as project_name, c.company_name as client_name, i.intervention_date as date_souhaitee, i.status as statut
        FROM interventions i
        LEFT JOIN projects p ON i.project_id = p.id
        LEFT JOIN crm_clients c ON i.client_id = c.id
        WHERE i.intervention_date >= ?
        ORDER BY i.intervention_date ASC
        LIMIT 5
      `).bind(today).all();
      upcomingInterventions = res.results || [];
    } catch (e) { console.warn('Upcoming Interventions Error:', e); }

    return c.json({
      success: true,
      kpi: {
        clients_active: clientsCount,
        projects_active: projectsCount,
        audits_active: auditsCount,
        interventions_week: interventionsCount,
        critical_defects: criticalDefects
      },
      audits: recentAudits,
      interventions: upcomingInterventions,
      alerts: [],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('GET /dashboard/unified/summary error:', error);
    return c.json({ success: false, error: 'Erreur serveur' }, 500);
  }
});

export default crmRoutes;
