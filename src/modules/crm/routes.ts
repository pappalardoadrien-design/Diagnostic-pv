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
      LEFT JOIN el_audits a ON a.client_id = c.id
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
      FROM el_audits 
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
    const audits = await DB.prepare('SELECT COUNT(*) as count FROM el_audits WHERE client_id = ?')
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
        id as audit_id,
        audit_token,
        project_name,
        location,
        total_modules,
        status,
        created_at,
        updated_at
      FROM el_audits 
      WHERE client_id = ?
      ORDER BY created_at DESC
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

export default crmRoutes;
