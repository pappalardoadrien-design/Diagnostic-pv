-- Migration 0040: Créer table diagnostiqueurs (Axe 2 & 3 Vision Arthur)
-- Objectif: Gérer le réseau national de diagnostiqueurs labellisés DiagPV

-- ============================================================================
-- TABLE diagnostiqueurs
-- ============================================================================
CREATE TABLE IF NOT EXISTS diagnostiqueurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identité
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telephone TEXT,
  
  -- Entreprise
  entreprise TEXT,
  siret TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  
  -- Labellisation DiagPV
  statut_label TEXT NOT NULL DEFAULT 'candidat' CHECK(statut_label IN ('candidat', 'en_evaluation', 'labellise', 'suspendu', 'refuse')),
  date_candidature DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_labellisation DATETIME,
  date_expiration_label DATETIME,
  numero_label TEXT UNIQUE, -- Format: DIAGPV-2025-001
  
  -- Certifications & Formations
  certifications TEXT, -- JSON array: ["IEC 62446-1", "NF C 15-100", "DTU 40.35"]
  formations TEXT, -- JSON array: [{name, date, organisme}]
  cv_url TEXT,
  kbis_url TEXT,
  assurance_rc_url TEXT,
  
  -- Expérience
  annees_experience INTEGER DEFAULT 0,
  nombre_audits_realises INTEGER DEFAULT 0,
  specialites TEXT, -- JSON array: ["EL", "IV", "VISUAL", "TOITURE"]
  
  -- Performance
  note_moyenne REAL DEFAULT 0, -- 0-5
  taux_conformite_moyen REAL DEFAULT 0, -- 0-100%
  delai_moyen_rapport INTEGER DEFAULT 0, -- en jours
  
  -- Disponibilité
  zones_intervention TEXT, -- JSON array: ["34", "30", "11", "66"]
  disponible BOOLEAN DEFAULT 1,
  capacite_audits_mois INTEGER DEFAULT 0,
  
  -- Admin
  notes_internes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER, -- user_id qui a créé
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_diagnostiqueurs_statut ON diagnostiqueurs(statut_label);
CREATE INDEX IF NOT EXISTS idx_diagnostiqueurs_disponible ON diagnostiqueurs(disponible);
CREATE INDEX IF NOT EXISTS idx_diagnostiqueurs_numero_label ON diagnostiqueurs(numero_label);
CREATE INDEX IF NOT EXISTS idx_diagnostiqueurs_email ON diagnostiqueurs(email);

-- ============================================================================
-- TABLE diagnostiqueurs_audits (Lien diagnostiqueur → audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS diagnostiqueurs_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagnostiqueur_id INTEGER NOT NULL,
  audit_token TEXT NOT NULL,
  
  -- Performance audit
  date_assignation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_realisation DATETIME,
  date_rapport_envoye DATETIME,
  delai_rapport_jours INTEGER, -- calculé automatiquement
  
  -- Évaluation
  note_client INTEGER, -- 1-5
  commentaire_client TEXT,
  note_diagpv INTEGER, -- 1-5 (qualité technique)
  commentaire_diagpv TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (diagnostiqueur_id) REFERENCES diagnostiqueurs(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_token) REFERENCES audits(audit_token) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_diag_audits_diagnostiqueur ON diagnostiqueurs_audits(diagnostiqueur_id);
CREATE INDEX IF NOT EXISTS idx_diag_audits_audit_token ON diagnostiqueurs_audits(audit_token);

-- ============================================================================
-- TABLE criteres_labellisation
-- ============================================================================
CREATE TABLE IF NOT EXISTS criteres_labellisation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, -- Ex: "CERT_IEC62446", "EXP_MIN_2ANS"
  nom TEXT NOT NULL,
  description TEXT,
  categorie TEXT NOT NULL, -- "certification", "experience", "equipement", "assurance"
  obligatoire BOOLEAN DEFAULT 1,
  points INTEGER DEFAULT 0, -- Système de points pour évaluation
  actif BOOLEAN DEFAULT 1,
  ordre INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_criteres_actif ON criteres_labellisation(actif);
CREATE INDEX IF NOT EXISTS idx_criteres_categorie ON criteres_labellisation(categorie);

-- ============================================================================
-- TABLE diagnostiqueurs_criteres (Validation critères pour chaque diagnostiqueur)
-- ============================================================================
CREATE TABLE IF NOT EXISTS diagnostiqueurs_criteres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagnostiqueur_id INTEGER NOT NULL,
  critere_id INTEGER NOT NULL,
  
  valide BOOLEAN DEFAULT 0,
  date_validation DATETIME,
  valide_par INTEGER, -- user_id
  commentaire TEXT,
  document_url TEXT, -- Justificatif
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (diagnostiqueur_id) REFERENCES diagnostiqueurs(id) ON DELETE CASCADE,
  FOREIGN KEY (critere_id) REFERENCES criteres_labellisation(id) ON DELETE CASCADE,
  FOREIGN KEY (valide_par) REFERENCES users(id) ON DELETE SET NULL,
  
  UNIQUE(diagnostiqueur_id, critere_id)
);

CREATE INDEX IF NOT EXISTS idx_diag_criteres_diagnostiqueur ON diagnostiqueurs_criteres(diagnostiqueur_id);
CREATE INDEX IF NOT EXISTS idx_diag_criteres_valide ON diagnostiqueurs_criteres(valide);
