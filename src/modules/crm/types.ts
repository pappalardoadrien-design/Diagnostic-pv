/**
 * Module CRM - Types TypeScript
 * 
 * Définitions de types pour le CRM léger DiagPV
 */

// ============================================================================
// BINDINGS CLOUDFLARE
// ============================================================================
export type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
};

// ============================================================================
// CRM CLIENT
// ============================================================================
export type ClientType = 'professional' | 'individual' | 'industrial';
export type ClientStatus = 'active' | 'inactive' | 'prospect';

export interface CrmClient {
  id: number;
  company_name: string;
  client_type: ClientType;
  siret?: string;
  tva_number?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country: string;
  main_contact_name?: string;
  main_contact_email?: string;
  main_contact_phone?: string;
  status: ClientStatus;
  acquisition_source?: string;
  assigned_to?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientRequest {
  company_name: string;
  client_type?: ClientType;
  siret?: string;
  tva_number?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  main_contact_name?: string;
  main_contact_email?: string;
  main_contact_phone?: string;
  status?: ClientStatus;
  acquisition_source?: string;
  assigned_to?: number;
  notes?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: number;
}

// ============================================================================
// CRM CONTACT
// ============================================================================
export interface CrmContact {
  id: number;
  client_id: number;
  first_name: string;
  last_name: string;
  role?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  is_primary: boolean;
  receive_reports: boolean;
  receive_invoices: boolean;
  notes?: string;
  created_at: string;
}

export interface CreateContactRequest {
  client_id: number;
  first_name: string;
  last_name: string;
  role?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  is_primary?: boolean;
  receive_reports?: boolean;
  receive_invoices?: boolean;
  notes?: string;
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {
  id: number;
}

// ============================================================================
// CLIENT WITH STATS
// ============================================================================
export interface ClientWithStats extends CrmClient {
  total_audits: number;
  last_audit_date?: string;
  contacts_count: number;
}
