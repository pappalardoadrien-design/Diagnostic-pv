-- Migration 0050: Create CRM Tables
-- Missing tables for Client Relationship Management

CREATE TABLE IF NOT EXISTS crm_clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  client_type TEXT DEFAULT 'professional', -- 'professional', 'individual', 'partner'
  siret TEXT,
  tva_number TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'France',
  main_contact_name TEXT,
  main_contact_email TEXT,
  main_contact_phone TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'lead'
  acquisition_source TEXT,
  assigned_to TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT, -- 'ceo', 'technical', 'administrative'
  department TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  is_primary INTEGER DEFAULT 0,
  receive_reports INTEGER DEFAULT 1,
  receive_invoices INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_clients_status ON crm_clients(status);
CREATE INDEX IF NOT EXISTS idx_crm_clients_company ON crm_clients(company_name);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_client ON crm_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
