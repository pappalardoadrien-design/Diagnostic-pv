-- Migration 0060: Module Audit Qualite Terrain
-- Intégration GIRASOLE → DiagPV CRM
-- 11 nouvelles tables avec FK vers crm_clients et projects
-- Date: 2026-02-23

-- ============================================================================
-- 1. SOUS-TRAITANTS (entreprises partenaires terrain)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sous_traitants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  siret TEXT,
  contact_nom TEXT,
  contact_email TEXT,
  contact_telephone TEXT,
  specialite TEXT,                -- 'electricite', 'toiture', 'structure', 'general'
  zone_intervention TEXT,         -- 'national', 'sud', 'nord', etc.
  statut TEXT DEFAULT 'actif',    -- 'actif', 'inactif', 'suspendu'
  note_qualite REAL,              -- Score moyen qualité 0-5
  nombre_missions INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sous_traitants_statut ON sous_traitants(statut);
CREATE INDEX IF NOT EXISTS idx_sous_traitants_nom ON sous_traitants(nom);

-- ============================================================================
-- 2. TECHNICIENS (personnes physiques terrain)
-- ============================================================================
CREATE TABLE IF NOT EXISTS techniciens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sous_traitant_id INTEGER,       -- NULL = technicien interne DiagPV
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  qualification TEXT,              -- 'habilitation_electrique', 'caces', 'travaux_hauteur'
  certifications TEXT,             -- JSON array: ["BR", "B2V", "CACES R486"]
  statut TEXT DEFAULT 'actif',     -- 'actif', 'inactif'
  note_moyenne REAL,               -- Score moyen qualité 0-5
  nombre_missions INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sous_traitant_id) REFERENCES sous_traitants(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_techniciens_sous_traitant ON techniciens(sous_traitant_id);
CREATE INDEX IF NOT EXISTS idx_techniciens_statut ON techniciens(statut);

-- ============================================================================
-- 3. ORDRES DE MISSION QUALITE (mission d'audit terrain)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ordres_mission_qualite (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Liens CRM
  project_id INTEGER NOT NULL,      -- FK → projects.id (centrale PV)
  client_id INTEGER,                -- FK → crm_clients.id (client/donneur d'ordre)
  -- Affectation
  technicien_id INTEGER,            -- FK → techniciens.id
  sous_traitant_id INTEGER,         -- FK → sous_traitants.id
  -- Infos mission
  reference TEXT UNIQUE,            -- Ex: "AQ-2026-001"
  type_audit TEXT NOT NULL DEFAULT 'SOL',  -- 'SOL', 'TOITURE', 'DOUBLE'
  statut TEXT DEFAULT 'planifie',   -- 'planifie', 'en_cours', 'termine', 'valide', 'annule'
  priorite TEXT DEFAULT 'normale',  -- 'urgente', 'haute', 'normale', 'basse'
  -- Dates
  date_planifiee DATE,
  date_debut DATETIME,
  date_fin DATETIME,
  -- Contexte terrain
  meteo TEXT,                       -- 'ensoleille', 'nuageux', 'pluie', 'vent'
  temperature_ambiante REAL,
  irradiance REAL,                  -- W/m²
  -- Résultats
  score_global REAL,                -- Score qualité global 0-100
  nb_non_conformites INTEGER DEFAULT 0,
  nb_observations INTEGER DEFAULT 0,
  nb_conformes INTEGER DEFAULT 0,
  -- Meta
  commentaire_general TEXT,
  notes_internes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE SET NULL,
  FOREIGN KEY (technicien_id) REFERENCES techniciens(id) ON DELETE SET NULL,
  FOREIGN KEY (sous_traitant_id) REFERENCES sous_traitants(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_omq_project ON ordres_mission_qualite(project_id);
CREATE INDEX IF NOT EXISTS idx_omq_client ON ordres_mission_qualite(client_id);
CREATE INDEX IF NOT EXISTS idx_omq_technicien ON ordres_mission_qualite(technicien_id);
CREATE INDEX IF NOT EXISTS idx_omq_statut ON ordres_mission_qualite(statut);
CREATE INDEX IF NOT EXISTS idx_omq_reference ON ordres_mission_qualite(reference);
CREATE INDEX IF NOT EXISTS idx_omq_date_planifiee ON ordres_mission_qualite(date_planifiee);

-- ============================================================================
-- 4. AQ_CHECKLIST_ITEMS (checklist conformité SOL - NF C 15-100)
-- ============================================================================
CREATE TABLE IF NOT EXISTS aq_checklist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL,      -- FK → ordres_mission_qualite.id
  -- Identification item
  categorie TEXT NOT NULL,          -- 'modules', 'cablage', 'protection', 'structure', 'etiquetage', 'onduleur', 'mise_terre'
  sous_categorie TEXT,
  code_item TEXT NOT NULL,          -- Ex: "MOD-01", "CAB-03"
  libelle TEXT NOT NULL,            -- Description du point de contrôle
  norme_reference TEXT,             -- "NF C 15-100 §7.712.1"
  -- Résultat
  conformite TEXT DEFAULT 'non_verifie',  -- 'conforme', 'non_conforme', 'observation', 'non_applicable', 'non_verifie'
  commentaire TEXT,
  severite TEXT,                    -- 'critique', 'majeur', 'mineur', 'info'
  -- Meta
  ordre_affichage INTEGER DEFAULT 0,
  verifie_par TEXT,                 -- Nom du technicien
  verifie_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mission_id) REFERENCES ordres_mission_qualite(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aq_items_mission ON aq_checklist_items(mission_id);
CREATE INDEX IF NOT EXISTS idx_aq_items_categorie ON aq_checklist_items(categorie);
CREATE INDEX IF NOT EXISTS idx_aq_items_conformite ON aq_checklist_items(conformite);

-- ============================================================================
-- 5. AQ_CHECKLIST_TOITURE_TEMPLATE (template checklist toiture DTU 40.35)
-- ============================================================================
CREATE TABLE IF NOT EXISTS aq_checklist_toiture_template (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categorie TEXT NOT NULL,          -- 'etancheite', 'fixation', 'ventilation', 'protection_incendie', 'acces_securite'
  code_item TEXT NOT NULL,
  libelle TEXT NOT NULL,
  norme_reference TEXT,             -- "DTU 40.35", "NF EN 62446-1"
  severite_defaut TEXT DEFAULT 'majeur',
  ordre_affichage INTEGER DEFAULT 0,
  actif INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aq_toiture_tpl_categorie ON aq_checklist_toiture_template(categorie);

-- ============================================================================
-- 6. AQ_CHECKLIST_ITEMS_TOITURE (résultats checklist toiture par mission)
-- ============================================================================
CREATE TABLE IF NOT EXISTS aq_checklist_items_toiture (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL,
  template_item_id INTEGER,         -- FK → aq_checklist_toiture_template.id
  -- Identification
  categorie TEXT NOT NULL,
  code_item TEXT NOT NULL,
  libelle TEXT NOT NULL,
  norme_reference TEXT,
  -- Résultat
  conformite TEXT DEFAULT 'non_verifie',
  commentaire TEXT,
  severite TEXT,
  -- Meta
  ordre_affichage INTEGER DEFAULT 0,
  verifie_par TEXT,
  verifie_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mission_id) REFERENCES ordres_mission_qualite(id) ON DELETE CASCADE,
  FOREIGN KEY (template_item_id) REFERENCES aq_checklist_toiture_template(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_aq_toiture_mission ON aq_checklist_items_toiture(mission_id);
CREATE INDEX IF NOT EXISTS idx_aq_toiture_conformite ON aq_checklist_items_toiture(conformite);

-- ============================================================================
-- 7. AQ_ITEM_PHOTOS (photos par item de checklist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS aq_item_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checklist_item_id INTEGER,        -- FK → aq_checklist_items.id OU aq_checklist_items_toiture.id
  checklist_type TEXT NOT NULL,      -- 'sol' ou 'toiture' (pour disambiguer la FK)
  mission_id INTEGER NOT NULL,      -- FK → ordres_mission_qualite.id (dénormalisé pour perf)
  -- Photo
  photo_url TEXT NOT NULL,
  photo_r2_key TEXT,                -- Clé R2 pour stockage
  thumbnail_url TEXT,
  -- Meta
  legende TEXT,
  type_photo TEXT DEFAULT 'defaut',  -- 'defaut', 'vue_ensemble', 'detail', 'avant', 'apres'
  latitude REAL,
  longitude REAL,
  prise_le DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mission_id) REFERENCES ordres_mission_qualite(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aq_photos_item ON aq_item_photos(checklist_item_id, checklist_type);
CREATE INDEX IF NOT EXISTS idx_aq_photos_mission ON aq_item_photos(mission_id);

-- ============================================================================
-- 8. AQ_COMMENTAIRES_FINAUX (commentaires de synthèse par mission)
-- ============================================================================
CREATE TABLE IF NOT EXISTS aq_commentaires_finaux (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL UNIQUE,  -- 1 commentaire final par mission
  -- Synthèse
  conclusion_generale TEXT,         -- Texte libre de synthèse
  recommandations TEXT,             -- Recommandations correctives
  actions_correctives TEXT,         -- JSON: [{"action": "...", "delai": "...", "priorite": "..."}]
  -- Signature
  signe_par TEXT,
  signe_le DATETIME,
  signature_data TEXT,              -- Base64 de la signature manuscrite
  -- Meta
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mission_id) REFERENCES ordres_mission_qualite(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aq_commentaires_mission ON aq_commentaires_finaux(mission_id);

-- ============================================================================
-- 9. AQ_PHOTOS_GENERALES (photos globales de la mission - vue ensemble)
-- ============================================================================
CREATE TABLE IF NOT EXISTS aq_photos_generales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL,
  -- Photo
  photo_url TEXT NOT NULL,
  photo_r2_key TEXT,
  thumbnail_url TEXT,
  -- Meta
  type_photo TEXT DEFAULT 'vue_ensemble',  -- 'vue_ensemble', 'environnement', 'acces', 'signalisation'
  legende TEXT,
  latitude REAL,
  longitude REAL,
  prise_le DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mission_id) REFERENCES ordres_mission_qualite(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aq_photos_gen_mission ON aq_photos_generales(mission_id);

-- ============================================================================
-- 10. AQ_RAPPORTS (rapports d'audit qualité générés)
-- ============================================================================
CREATE TABLE IF NOT EXISTS aq_rapports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL,
  -- Infos rapport
  reference TEXT UNIQUE,            -- Ex: "RAQ-2026-001"
  titre TEXT,
  version INTEGER DEFAULT 1,
  statut TEXT DEFAULT 'brouillon',  -- 'brouillon', 'genere', 'valide', 'envoye'
  -- Contenu
  html_content TEXT,                -- HTML du rapport complet
  pdf_url TEXT,                     -- URL PDF stocké sur R2
  pdf_r2_key TEXT,
  -- Résumé
  score_conformite REAL,            -- % de conformité
  nb_non_conformites INTEGER DEFAULT 0,
  nb_observations INTEGER DEFAULT 0,
  -- Validation
  valide_par TEXT,
  valide_le DATETIME,
  envoye_a TEXT,                    -- Email(s) destinataires
  envoye_le DATETIME,
  -- Meta
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mission_id) REFERENCES ordres_mission_qualite(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aq_rapports_mission ON aq_rapports(mission_id);
CREATE INDEX IF NOT EXISTS idx_aq_rapports_reference ON aq_rapports(reference);
CREATE INDEX IF NOT EXISTS idx_aq_rapports_statut ON aq_rapports(statut);

-- ============================================================================
-- 11. AQ_RAPPORTS_COMPLEMENTS (pièces jointes complémentaires au rapport)
-- ============================================================================
CREATE TABLE IF NOT EXISTS aq_rapports_complements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rapport_id INTEGER NOT NULL,
  -- Fichier
  type_complement TEXT NOT NULL,    -- 'annexe_technique', 'photo_supplementaire', 'document_norme', 'plan_correction'
  titre TEXT NOT NULL,
  description TEXT,
  fichier_url TEXT,
  fichier_r2_key TEXT,
  -- Meta
  ordre_affichage INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rapport_id) REFERENCES aq_rapports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aq_complements_rapport ON aq_rapports_complements(rapport_id);

-- ============================================================================
-- INSERTION DES TEMPLATES CHECKLIST SOL (NF C 15-100)
-- 36 items de base, 7 catégories
-- ============================================================================

-- Catégorie: MODULES
INSERT INTO aq_checklist_toiture_template (categorie, code_item, libelle, norme_reference, severite_defaut, ordre_affichage) VALUES
-- Note: On utilise la table template aussi pour SOL pour cohérence
-- Les items SOL seront insérés directement dans aq_checklist_items à la création de mission

-- TEMPLATES TOITURE (DTU 40.35)
('etancheite', 'ETN-01', 'Absence de fuite/infiltration visible en sous-face', 'DTU 40.35 §5.1', 'critique', 1),
('etancheite', 'ETN-02', 'Raccords d''étanchéité autour des fixations conformes', 'DTU 40.35 §5.3', 'critique', 2),
('etancheite', 'ETN-03', 'Membrane sous-panneaux en bon état', 'DTU 40.35 §5.2', 'majeur', 3),
('etancheite', 'ETN-04', 'Pas de stagnation d''eau sur la toiture', 'DTU 40.35 §4.2', 'majeur', 4),
('fixation', 'FIX-01', 'Rails de fixation correctement ancrés', 'NF EN 1991-1-4', 'critique', 5),
('fixation', 'FIX-02', 'Absence de corrosion sur les fixations', 'NF EN 62446-1', 'majeur', 6),
('fixation', 'FIX-03', 'Serrage des boulons/vis vérifié', 'Guide UTE C 15-712-1', 'majeur', 7),
('fixation', 'FIX-04', 'Conformité des crochets/pattes de fixation', 'NF EN 1090-2', 'critique', 8),
('ventilation', 'VEN-01', 'Lame d''air sous les panneaux suffisante (>40mm)', 'NF EN 62446-1 §A.3', 'majeur', 9),
('ventilation', 'VEN-02', 'Absence d''obstruction des grilles de ventilation', 'DTU 40.35 §6.1', 'mineur', 10),
('protection_incendie', 'INC-01', 'Passage coupe-feu conforme aux prescriptions', 'Arrêté 22/10/2010', 'critique', 11),
('protection_incendie', 'INC-02', 'Distance modules/faîtage respectée (>0.5m)', 'SDIS prescriptions', 'critique', 12),
('protection_incendie', 'INC-03', 'Signalétique PV visible pour pompiers', 'NF C 15-100 §7.712', 'majeur', 13),
('acces_securite', 'SEC-01', 'Accès toiture sécurisé (ligne de vie/garde-corps)', 'Code du travail R4323', 'critique', 14),
('acces_securite', 'SEC-02', 'Chemin de circulation sur toiture dégagé', 'NF EN 62446-1', 'majeur', 15),
('acces_securite', 'SEC-03', 'Points d''ancrage certifiés et accessibles', 'NF EN 795', 'critique', 16);

-- ============================================================================
-- VUE STATISTIQUES AUDIT QUALITE
-- ============================================================================
CREATE VIEW IF NOT EXISTS v_aq_missions_stats AS
SELECT
  omq.id,
  omq.reference,
  omq.type_audit,
  omq.statut,
  omq.date_planifiee,
  omq.score_global,
  p.name AS project_name,
  p.site_address AS project_location,
  p.installation_power AS power_kwc,
  cc.company_name AS client_name,
  t.nom || ' ' || t.prenom AS technicien_name,
  st.nom AS sous_traitant_name,
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
LEFT JOIN techniciens t ON omq.technicien_id = t.id
LEFT JOIN sous_traitants st ON omq.sous_traitant_id = st.id;
