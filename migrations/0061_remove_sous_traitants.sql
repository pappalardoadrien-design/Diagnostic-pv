-- Migration 0061: Retrait du module sous-traitants
-- Supprime la table sous_traitants, la colonne FK dans ordres_mission_qualite et techniciens,
-- et recrée la vue v_aq_missions_stats sans le JOIN sous_traitants.
-- Date: 2026-02-23

-- ============================================================================
-- 1. RECRÉER LA VUE SANS sous_traitants
-- ============================================================================
DROP VIEW IF EXISTS v_aq_missions_stats;

CREATE VIEW IF NOT EXISTS v_aq_missions_stats AS
SELECT
  omq.id,
  omq.reference,
  omq.type_audit,
  omq.statut,
  omq.priorite,
  omq.date_planifiee,
  omq.date_debut,
  omq.date_fin,
  omq.meteo,
  omq.temperature_ambiante,
  omq.irradiance,
  omq.score_global,
  omq.nb_non_conformites,
  omq.nb_observations,
  omq.nb_conformes,
  omq.commentaire_general,
  omq.notes_internes,
  omq.created_at,
  omq.updated_at,
  -- Projet
  omq.project_id,
  p.name AS project_name,
  p.site_address AS project_location,
  p.installation_power AS power_kwc,
  -- Client
  omq.client_id,
  cc.company_name AS client_name,
  -- Technicien
  omq.technicien_id,
  t.nom || ' ' || t.prenom AS technicien_name,
  -- Stats items SOL
  (SELECT COUNT(*) FROM aq_checklist_items ci WHERE ci.mission_id = omq.id) AS total_items_sol,
  (SELECT COUNT(*) FROM aq_checklist_items ci WHERE ci.mission_id = omq.id AND ci.conformite = 'conforme') AS conformes_sol,
  (SELECT COUNT(*) FROM aq_checklist_items ci WHERE ci.mission_id = omq.id AND ci.conformite = 'non_conforme') AS nc_sol,
  -- Stats items TOITURE
  (SELECT COUNT(*) FROM aq_checklist_items_toiture ct WHERE ct.mission_id = omq.id) AS total_items_toiture,
  (SELECT COUNT(*) FROM aq_checklist_items_toiture ct WHERE ct.mission_id = omq.id AND ct.conformite = 'conforme') AS conformes_toiture,
  (SELECT COUNT(*) FROM aq_checklist_items_toiture ct WHERE ct.mission_id = omq.id AND ct.conformite = 'non_conforme') AS nc_toiture,
  -- Photos count
  (SELECT COUNT(*) FROM aq_item_photos ip WHERE ip.mission_id = omq.id) AS total_photos,
  (SELECT COUNT(*) FROM aq_photos_generales pg WHERE pg.mission_id = omq.id) AS total_photos_generales
FROM ordres_mission_qualite omq
LEFT JOIN projects p ON omq.project_id = p.id
LEFT JOIN crm_clients cc ON omq.client_id = cc.id
LEFT JOIN techniciens t ON omq.technicien_id = t.id;

-- ============================================================================
-- 2. SUPPRIMER LA TABLE sous_traitants
-- ============================================================================
-- Note: SQLite ne supporte pas DROP COLUMN nativement avant 3.35.0
-- La colonne sous_traitant_id reste dans les tables mais ne sera plus utilisée.
-- Les FK ON DELETE SET NULL assurent l'intégrité si la table est supprimée.
DROP TABLE IF EXISTS sous_traitants;

-- Supprimer les index orphelins
DROP INDEX IF EXISTS idx_sous_traitants_statut;
DROP INDEX IF EXISTS idx_sous_traitants_nom;
DROP INDEX IF EXISTS idx_techniciens_sous_traitant;
