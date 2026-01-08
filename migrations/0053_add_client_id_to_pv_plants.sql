-- Migration: Ajouter client_id à pv_plants pour interconnexion CRM
-- Date: 08/01/2026
-- Description: Permet de lier les centrales PV aux clients CRM

-- Ajouter la colonne client_id à pv_plants
ALTER TABLE pv_plants ADD COLUMN client_id INTEGER REFERENCES crm_clients(id) ON DELETE SET NULL;

-- Index pour améliorer les performances des requêtes par client
CREATE INDEX IF NOT EXISTS idx_pv_plants_client_id ON pv_plants(client_id);

-- Commentaire: Cette migration crée le lien entre les centrales PV et les clients CRM
-- Les centrales existantes auront client_id = NULL
-- Lors de la création d'une nouvelle centrale, on peut spécifier le client associé
