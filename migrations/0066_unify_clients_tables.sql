-- Migration 0066: Unification clients / crm_clients
-- Raison: Double table clients (0004) et crm_clients (0050) crée des incohérences
-- Solution: Copier données clients → crm_clients si absentes, puis garder FK intacte

-- S'assurer que chaque client de la table 'clients' a un equivalent dans 'crm_clients'
INSERT OR IGNORE INTO crm_clients (company_name, main_contact_email, main_contact_phone, siret, notes, status, created_at)
  SELECT name, contact_email, contact_phone, siret, notes, 'active', created_at
  FROM clients
  WHERE name NOT IN (SELECT company_name FROM crm_clients);

-- Note: on ne DROP pas la table 'clients' car 'projects' a un FK vers clients(id)
-- et SQLite ne permet pas d'ALTER les FK facilement
-- La table 'clients' reste comme alias/backup, 'crm_clients' est la source de vérité
