-- ============================================================================
-- MIGRATION 0043: Système Affectation Missions
-- ============================================================================
-- Gestion affectation audits aux diagnostiqueurs avec matching automatique
-- ============================================================================

-- Table des missions (audits à affecter)
CREATE TABLE IF NOT EXISTS missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Lien projet/intervention
  project_id INTEGER NOT NULL,
  intervention_id INTEGER, -- NULL si pas encore créée
  
  -- Informations mission
  titre TEXT NOT NULL,
  description TEXT,
  type_audit TEXT NOT NULL, -- CONFORMITE, TOITURE, EL, IV, THERMIQUE, etc.
  priorite TEXT DEFAULT 'normale' CHECK(priorite IN ('basse', 'normale', 'haute', 'urgente')),
  
  -- Localisation
  site_address TEXT NOT NULL,
  code_postal TEXT NOT NULL,
  ville TEXT,
  gps_latitude REAL,
  gps_longitude REAL,
  
  -- Planning
  date_souhaitee DATE,
  date_limite DATE,
  duree_estimee_heures REAL DEFAULT 4,
  
  -- Compétences requises
  competences_requises TEXT, -- JSON array: ["EL", "thermographie"]
  certification_minimale TEXT, -- qualiPV, etc.
  
  -- Statut mission
  statut TEXT DEFAULT 'en_attente' CHECK(statut IN ('en_attente', 'proposee', 'affectee', 'acceptee', 'en_cours', 'terminee', 'validee', 'annulee')),
  diagnostiqueur_affecte_id INTEGER, -- NULL si pas encore affecté
  date_affectation DATETIME,
  date_acceptation DATETIME,
  date_debut DATETIME,
  date_fin DATETIME,
  
  -- Financier
  budget_prevu REAL,
  tarif_horaire REAL DEFAULT 85,
  frais_deplacement REAL DEFAULT 150,
  
  -- Métadonnées
  notes_internes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE SET NULL,
  FOREIGN KEY (diagnostiqueur_affecte_id) REFERENCES diagnostiqueurs(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES auth_users(id) ON DELETE SET NULL
);

-- Table propositions (multi-diagnostiqueurs)
CREATE TABLE IF NOT EXISTS missions_propositions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  mission_id INTEGER NOT NULL,
  diagnostiqueur_id INTEGER NOT NULL,
  
  -- Scoring matching
  score_matching REAL DEFAULT 0, -- 0-100
  distance_km REAL,
  disponibilite_confirmee BOOLEAN DEFAULT 0,
  
  -- Statut proposition
  statut TEXT DEFAULT 'proposee' CHECK(statut IN ('proposee', 'vue', 'acceptee', 'refusee', 'expiree')),
  date_proposition DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_vue DATETIME,
  date_reponse DATETIME,
  motif_refus TEXT,
  
  -- Notification
  notification_envoyee BOOLEAN DEFAULT 0,
  date_notification DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  FOREIGN KEY (diagnostiqueur_id) REFERENCES diagnostiqueurs(id) ON DELETE CASCADE,
  UNIQUE(mission_id, diagnostiqueur_id)
);

-- Table historique statuts (audit trail)
CREATE TABLE IF NOT EXISTS missions_historique (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  mission_id INTEGER NOT NULL,
  statut_precedent TEXT,
  statut_nouveau TEXT NOT NULL,
  
  commentaire TEXT,
  modified_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  FOREIGN KEY (modified_by) REFERENCES auth_users(id) ON DELETE SET NULL
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_missions_statut ON missions(statut);
CREATE INDEX IF NOT EXISTS idx_missions_diagnostiqueur ON missions(diagnostiqueur_affecte_id);
CREATE INDEX IF NOT EXISTS idx_missions_date_souhaitee ON missions(date_souhaitee);
CREATE INDEX IF NOT EXISTS idx_missions_code_postal ON missions(code_postal);
CREATE INDEX IF NOT EXISTS idx_missions_project ON missions(project_id);

CREATE INDEX IF NOT EXISTS idx_propositions_mission ON missions_propositions(mission_id);
CREATE INDEX IF NOT EXISTS idx_propositions_diagnostiqueur ON missions_propositions(diagnostiqueur_id);
CREATE INDEX IF NOT EXISTS idx_propositions_statut ON missions_propositions(statut);

CREATE INDEX IF NOT EXISTS idx_historique_mission ON missions_historique(mission_id);

-- Vue synthèse missions
CREATE VIEW IF NOT EXISTS v_missions_actives AS
SELECT 
  m.*,
  p.name as project_name,
  p.client_id,
  d.nom as diagnostiqueur_nom,
  d.prenom as diagnostiqueur_prenom,
  d.email as diagnostiqueur_email,
  d.telephone as diagnostiqueur_telephone,
  (SELECT COUNT(*) FROM missions_propositions WHERE mission_id = m.id AND statut = 'proposee') as propositions_en_attente
FROM missions m
LEFT JOIN projects p ON m.project_id = p.id
LEFT JOIN diagnostiqueurs d ON m.diagnostiqueur_affecte_id = d.id
WHERE m.statut NOT IN ('terminee', 'validee', 'annulee')
ORDER BY 
  CASE m.priorite
    WHEN 'urgente' THEN 1
    WHEN 'haute' THEN 2
    WHEN 'normale' THEN 3
    WHEN 'basse' THEN 4
  END,
  m.date_souhaitee ASC;
