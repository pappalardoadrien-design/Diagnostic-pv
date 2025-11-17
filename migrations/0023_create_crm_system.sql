-- ============================================================================
-- MIGRATION 0023: CRM Léger - Clients & Contacts
-- Date: 2025-11-17
-- Objectif: Gestion clients et rattachement aux audits
-- ============================================================================

-- ============================================================================
-- TABLE: crm_clients
-- Clients DiagPV (donneurs d'ordre)
-- ============================================================================
CREATE TABLE IF NOT EXISTS crm_clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identification
  company_name TEXT NOT NULL,
  client_type TEXT NOT NULL DEFAULT 'professional',  -- professional, individual, industrial
  siret TEXT,
  tva_number TEXT,
  
  -- Coordonnées
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'France',
  
  -- Contact principal
  main_contact_name TEXT,
  main_contact_email TEXT,
  main_contact_phone TEXT,
  
  -- Informations commerciales
  status TEXT DEFAULT 'active',                      -- active, inactive, prospect
  acquisition_source TEXT,
  assigned_to INTEGER,                               -- ID user responsable commercial
  
  -- Métadonnées
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (assigned_to) REFERENCES auth_users(id)
);

-- ============================================================================
-- TABLE: crm_contacts
-- Contacts multiples par client
-- ============================================================================
CREATE TABLE IF NOT EXISTS crm_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  
  -- Identité
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT,
  department TEXT,
  
  -- Coordonnées
  email TEXT,
  phone TEXT,
  mobile TEXT,
  
  -- Préférences
  is_primary BOOLEAN DEFAULT 0,
  receive_reports BOOLEAN DEFAULT 1,
  receive_invoices BOOLEAN DEFAULT 0,
  
  -- Métadonnées
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE CASCADE
);

-- ============================================================================
-- MODIFICATION TABLE EXISTANTE: el_audits
-- Ajout colonne client_id pour rattachement CRM
-- ============================================================================
ALTER TABLE el_audits ADD COLUMN client_id INTEGER REFERENCES crm_clients(id);

-- ============================================================================
-- INDEX POUR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_crm_clients_status ON crm_clients(status);
CREATE INDEX IF NOT EXISTS idx_crm_clients_assigned ON crm_clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_client ON crm_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_primary ON crm_contacts(client_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_el_audits_client ON el_audits(client_id);

-- ============================================================================
-- DONNÉES TEST (Optionnel - Clients exemples)
-- ============================================================================
INSERT INTO crm_clients (company_name, client_type, city, main_contact_name, main_contact_email, main_contact_phone, status, assigned_to)
VALUES 
  ('TotalEnergies', 'industrial', 'Paris', 'Jean Dupont', 'j.dupont@totalenergies.com', '+33 1 47 44 45 46', 'active', 1),
  ('EDF Renouvelables', 'industrial', 'Lyon', 'Marie Martin', 'm.martin@edf-renouvelables.fr', '+33 4 72 82 49 00', 'active', 1),
  ('Engie Green', 'industrial', 'Marseille', 'Pierre Durant', 'p.durant@engie.com', '+33 4 91 13 15 00', 'active', 1);

-- Contacts pour TotalEnergies
INSERT INTO crm_contacts (client_id, first_name, last_name, role, email, phone, is_primary, receive_reports)
VALUES 
  (1, 'Jean', 'Dupont', 'Directeur Technique', 'j.dupont@totalenergies.com', '+33 1 47 44 45 46', 1, 1),
  (1, 'Sophie', 'Bernard', 'Responsable Maintenance', 's.bernard@totalenergies.com', '+33 1 47 44 45 47', 0, 1);

-- Contacts pour EDF
INSERT INTO crm_contacts (client_id, first_name, last_name, role, email, phone, is_primary, receive_reports)
VALUES 
  (2, 'Marie', 'Martin', 'Directrice Projets', 'm.martin@edf-renouvelables.fr', '+33 4 72 82 49 00', 1, 1);

-- Contacts pour Engie
INSERT INTO crm_contacts (client_id, first_name, last_name, role, email, phone, is_primary, receive_reports)
VALUES 
  (3, 'Pierre', 'Durant', 'Chef de Parc', 'p.durant@engie.com', '+33 4 91 13 15 00', 1, 1);

-- ============================================================================
-- RATTACHEMENT AUDITS EXISTANTS (Exemples)
-- ============================================================================
UPDATE el_audits SET client_id = 1 WHERE client_name LIKE '%TotalEnergies%';
UPDATE el_audits SET client_id = 2 WHERE client_name LIKE '%EDF%';
UPDATE el_audits SET client_id = 3 WHERE client_name LIKE '%Engie%' OR client_name LIKE '%Bouygues%';
