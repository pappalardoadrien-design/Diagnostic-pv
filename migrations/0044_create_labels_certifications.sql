-- ============================================================================
-- MIGRATION 0044: LABEL DIAGPV/AFPA - CERTIFICATION DIAGNOSTIQUEURS + CENTRALES
-- ============================================================================
-- Date: 2025-01-20
-- Objectif: Créer système de certification double:
--   1. Certification Diagnostiqueurs (via formation AFPA)
--   2. Certification Centrales PV (après audits qualité DiagPV)
--
-- Vision stratégique: Base pour futur métier RNCP certifié
-- ============================================================================

-- ============================================================================
-- TABLE 1: CERTIFICATIONS DIAGNOSTIQUEURS (Formation AFPA + DiagPV)
-- ============================================================================
CREATE TABLE IF NOT EXISTS labels_diagnostiqueurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagnostiqueur_id INTEGER NOT NULL,
  
  -- Numéro de label unique
  numero_label TEXT NOT NULL UNIQUE,
  -- Format: DIAGPV-DIAG-YYYY-NNNN (ex: DIAGPV-DIAG-2025-0001)
  
  -- Niveau de certification
  niveau TEXT NOT NULL CHECK(niveau IN ('junior', 'confirme', 'expert', 'formateur')),
  -- junior: Formation AFPA validée (0-10 audits)
  -- confirme: 10-50 audits avec note > 4/5
  -- expert: 50-100 audits avec note > 4.5/5
  -- formateur: Expert + habilitation former diagnostiqueurs
  
  -- Spécialités certifiées
  specialites_certifiees TEXT NOT NULL,
  -- JSON array: ["CONFORMITE", "TOITURE", "EL", "IV", "THERMIQUE"]
  
  -- Formation AFPA
  afpa_formation_completee INTEGER DEFAULT 0,
  afpa_date_formation DATE,
  afpa_formateur TEXT,
  afpa_centre TEXT,
  afpa_duree_heures INTEGER,
  afpa_certificat_numero TEXT,
  
  -- Évaluation DiagPV
  evaluation_theorique_score REAL,
  evaluation_pratique_score REAL,
  evaluation_terrain_score REAL,
  note_evaluation_globale REAL,
  
  -- Dates certification
  date_delivrance DATE NOT NULL,
  date_expiration DATE NOT NULL,
  duree_validite_annees INTEGER DEFAULT 2,
  
  -- Statut
  statut TEXT DEFAULT 'actif' CHECK(statut IN ('actif', 'suspendu', 'expire', 'revoque')),
  raison_suspension TEXT,
  date_suspension DATETIME,
  
  -- Audit trail
  delivre_par TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (diagnostiqueur_id) REFERENCES diagnostiqueurs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_labels_diag_numero ON labels_diagnostiqueurs(numero_label);
CREATE INDEX IF NOT EXISTS idx_labels_diag_diagnostiqueur ON labels_diagnostiqueurs(diagnostiqueur_id);
CREATE INDEX IF NOT EXISTS idx_labels_diag_statut ON labels_diagnostiqueurs(statut);
CREATE INDEX IF NOT EXISTS idx_labels_diag_expiration ON labels_diagnostiqueurs(date_expiration);

-- ============================================================================
-- TABLE 2: CERTIFICATIONS CENTRALES PV (Qualité audits DiagPV)
-- ============================================================================
CREATE TABLE IF NOT EXISTS labels_centrales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  
  -- Numéro de label unique
  numero_label TEXT NOT NULL UNIQUE,
  -- Format: DIAGPV-PV-YYYY-NNNN (ex: DIAGPV-PV-2025-0001)
  
  -- Niveau de label (qualité installation)
  niveau TEXT NOT NULL CHECK(niveau IN ('bronze', 'argent', 'or', 'platine')),
  -- bronze: Conforme minimal (taux conformité 70-79%)
  -- argent: Bonne qualité (taux conformité 80-89%)
  -- or: Excellente qualité (taux conformité 90-95%)
  -- platine: Qualité exceptionnelle (taux conformité > 95%, zéro défaut critique)
  
  -- Critères d'attribution
  taux_conformite REAL NOT NULL,
  nombre_defauts_critiques INTEGER DEFAULT 0,
  nombre_defauts_majeurs INTEGER DEFAULT 0,
  nombre_defauts_mineurs INTEGER DEFAULT 0,
  score_global REAL NOT NULL,
  
  -- Audits réalisés (base certification)
  audit_conformite_id INTEGER,
  audit_toiture_id INTEGER,
  audit_el_id INTEGER,
  audit_iv_id INTEGER,
  audit_thermique_id INTEGER,
  nombre_audits_realises INTEGER DEFAULT 0,
  
  -- Puissance et production
  puissance_installee_kwc REAL,
  production_estimee_kwh_an REAL,
  performance_ratio REAL,
  
  -- Dates certification
  date_delivrance DATE NOT NULL,
  date_expiration DATE NOT NULL,
  duree_validite_annees INTEGER DEFAULT 2,
  
  -- Statut
  statut TEXT DEFAULT 'actif' CHECK(statut IN ('actif', 'suspendu', 'expire', 'revoque', 'en_renouvellement')),
  raison_suspension TEXT,
  date_suspension DATETIME,
  
  -- Visibilité publique
  public INTEGER DEFAULT 1,
  qr_code_url TEXT,
  url_verification TEXT,
  
  -- Audit trail
  delivre_par TEXT,
  diagnostiqueur_principal_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_conformite_id) REFERENCES audits(id) ON DELETE SET NULL,
  FOREIGN KEY (diagnostiqueur_principal_id) REFERENCES diagnostiqueurs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_labels_centrales_numero ON labels_centrales(numero_label);
CREATE INDEX IF NOT EXISTS idx_labels_centrales_project ON labels_centrales(project_id);
CREATE INDEX IF NOT EXISTS idx_labels_centrales_niveau ON labels_centrales(niveau);
CREATE INDEX IF NOT EXISTS idx_labels_centrales_statut ON labels_centrales(statut);
CREATE INDEX IF NOT EXISTS idx_labels_centrales_expiration ON labels_centrales(date_expiration);
CREATE INDEX IF NOT EXISTS idx_labels_centrales_public ON labels_centrales(public);

-- ============================================================================
-- TABLE 3: HISTORIQUE RENOUVELLEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS labels_historique (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Type de label
  type_label TEXT NOT NULL CHECK(type_label IN ('diagnostiqueur', 'centrale')),
  label_id INTEGER NOT NULL,
  
  -- Action
  action TEXT NOT NULL CHECK(action IN ('delivrance', 'renouvellement', 'suspension', 'revocation', 'reactivation')),
  
  -- Détails
  ancien_statut TEXT,
  nouveau_statut TEXT,
  ancienne_expiration DATE,
  nouvelle_expiration DATE,
  ancien_niveau TEXT,
  nouveau_niveau TEXT,
  
  -- Justification
  raison TEXT NOT NULL,
  commentaire TEXT,
  
  -- Acteur
  effectue_par TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_labels_historique_type ON labels_historique(type_label, label_id);
CREATE INDEX IF NOT EXISTS idx_labels_historique_action ON labels_historique(action);

-- ============================================================================
-- TABLE 4: FORMATION CONTINUE DIAGNOSTIQUEURS
-- ============================================================================
CREATE TABLE IF NOT EXISTS labels_formations_continues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label_diagnostiqueur_id INTEGER NOT NULL,
  
  -- Formation
  titre_formation TEXT NOT NULL,
  organisme TEXT,
  formateur TEXT,
  duree_heures INTEGER,
  
  -- Thématiques
  thematiques TEXT,
  -- JSON array: ["nouvelles_normes_2025", "thermographie_drone", "pid_detection"]
  
  -- Validation
  date_formation DATE NOT NULL,
  certificat_obtenu INTEGER DEFAULT 0,
  note_obtenue REAL,
  
  -- Comptabilisation
  credits_formation INTEGER DEFAULT 0,
  -- Crédits pour maintien label (ex: 20h/an requis)
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (label_diagnostiqueur_id) REFERENCES labels_diagnostiqueurs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_formations_continues_label ON labels_formations_continues(label_diagnostiqueur_id);
CREATE INDEX IF NOT EXISTS idx_formations_continues_date ON labels_formations_continues(date_formation);

-- ============================================================================
-- TABLE 5: RÉCLAMATIONS ET LITIGES LABELS
-- ============================================================================
CREATE TABLE IF NOT EXISTS labels_reclamations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Cible de la réclamation
  type_label TEXT NOT NULL CHECK(type_label IN ('diagnostiqueur', 'centrale')),
  label_id INTEGER NOT NULL,
  
  -- Réclamant
  reclamant_nom TEXT NOT NULL,
  reclamant_email TEXT,
  reclamant_telephone TEXT,
  reclamant_relation TEXT,
  -- Ex: "client", "diagnostiqueur", "assureur", "autorité"
  
  -- Réclamation
  objet TEXT NOT NULL,
  description TEXT NOT NULL,
  gravite TEXT NOT NULL CHECK(gravite IN ('mineure', 'moderee', 'grave', 'critique')),
  
  -- Documents
  pieces_jointes TEXT,
  -- JSON array URLs
  
  -- Traitement
  statut TEXT DEFAULT 'en_attente' CHECK(statut IN ('en_attente', 'en_cours', 'resolue', 'rejetee', 'escaladee')),
  date_resolution DATETIME,
  resolution_description TEXT,
  mesures_correctives TEXT,
  
  -- Impact sur label
  impact_label TEXT,
  -- Ex: "suspension_immediate", "avertissement", "aucun", "revocation"
  
  -- Audit trail
  assignee TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reclamations_type ON labels_reclamations(type_label, label_id);
CREATE INDEX IF NOT EXISTS idx_reclamations_statut ON labels_reclamations(statut);
CREATE INDEX IF NOT EXISTS idx_reclamations_gravite ON labels_reclamations(gravite);

-- ============================================================================
-- VUE 1: DIAGNOSTIQUEURS LABELISÉS ACTIFS
-- ============================================================================
CREATE VIEW IF NOT EXISTS v_diagnostiqueurs_labellises AS
SELECT 
  ld.id as label_id,
  ld.numero_label,
  ld.niveau,
  ld.date_delivrance,
  ld.date_expiration,
  ld.statut as statut_label,
  
  d.id as diagnostiqueur_id,
  d.nom,
  d.prenom,
  d.email,
  d.telephone,
  d.specialites,
  d.zones_intervention,
  d.nombre_audits_realises,
  d.note_moyenne,
  
  julianday(ld.date_expiration) - julianday('now') as jours_avant_expiration,
  
  CASE 
    WHEN julianday(ld.date_expiration) < julianday('now') THEN 'expire'
    WHEN julianday(ld.date_expiration) - julianday('now') <= 30 THEN 'expire_bientot'
    ELSE 'actif'
  END as alerte_expiration

FROM labels_diagnostiqueurs ld
INNER JOIN diagnostiqueurs d ON ld.diagnostiqueur_id = d.id
WHERE ld.statut = 'actif'
ORDER BY ld.date_expiration ASC;

-- ============================================================================
-- VUE 2: CENTRALES LABELLISÉES ACTIVES
-- ============================================================================
CREATE VIEW IF NOT EXISTS v_centrales_labellisees AS
SELECT 
  lc.id as label_id,
  lc.numero_label,
  lc.niveau,
  lc.taux_conformite,
  lc.score_global,
  lc.date_delivrance,
  lc.date_expiration,
  lc.statut as statut_label,
  lc.public,
  
  p.id as project_id,
  p.name as centrale_nom,
  p.address as centrale_adresse,
  p.city as centrale_ville,
  p.postal_code as centrale_cp,
  p.capacity_kwc as puissance_kwc,
  p.client_id,
  
  c.name as client_nom,
  
  julianday(lc.date_expiration) - julianday('now') as jours_avant_expiration,
  
  CASE 
    WHEN julianday(lc.date_expiration) < julianday('now') THEN 'expire'
    WHEN julianday(lc.date_expiration) - julianday('now') <= 60 THEN 'expire_bientot'
    ELSE 'actif'
  END as alerte_expiration

FROM labels_centrales lc
INNER JOIN projects p ON lc.project_id = p.id
LEFT JOIN clients c ON p.client_id = c.id
WHERE lc.statut = 'actif'
ORDER BY lc.niveau DESC, lc.date_expiration ASC;

-- ============================================================================
-- VUE 3: STATISTIQUES GLOBALES LABELS
-- ============================================================================
CREATE VIEW IF NOT EXISTS v_labels_stats_globales AS
SELECT 
  -- Diagnostiqueurs
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE statut = 'actif') as diag_actifs,
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE statut = 'suspendu') as diag_suspendus,
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE statut = 'expire') as diag_expires,
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE niveau = 'junior') as diag_junior,
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE niveau = 'confirme') as diag_confirme,
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE niveau = 'expert') as diag_expert,
  (SELECT COUNT(*) FROM labels_diagnostiqueurs WHERE niveau = 'formateur') as diag_formateur,
  
  -- Centrales
  (SELECT COUNT(*) FROM labels_centrales WHERE statut = 'actif') as centrales_actives,
  (SELECT COUNT(*) FROM labels_centrales WHERE statut = 'expire') as centrales_expirees,
  (SELECT COUNT(*) FROM labels_centrales WHERE niveau = 'bronze') as centrales_bronze,
  (SELECT COUNT(*) FROM labels_centrales WHERE niveau = 'argent') as centrales_argent,
  (SELECT COUNT(*) FROM labels_centrales WHERE niveau = 'or') as centrales_or,
  (SELECT COUNT(*) FROM labels_centrales WHERE niveau = 'platine') as centrales_platine,
  (SELECT AVG(taux_conformite) FROM labels_centrales WHERE statut = 'actif') as taux_conformite_moyen,
  
  -- Réclamations
  (SELECT COUNT(*) FROM labels_reclamations WHERE statut = 'en_attente') as reclamations_en_attente,
  (SELECT COUNT(*) FROM labels_reclamations WHERE gravite = 'critique') as reclamations_critiques;
