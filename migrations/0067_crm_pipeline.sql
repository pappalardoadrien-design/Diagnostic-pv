-- Migration 0067: CRM Pipeline - Statuts prospect→signé + opportunités
-- Date: 2026-03-06

-- ============================================================================
-- 1. TABLE PIPELINE OPPORTUNITIES (Opportunités commerciales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS crm_opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  -- Pipeline stages: prospect → qualification → proposition → negociation → signe → perdu
  stage TEXT NOT NULL DEFAULT 'prospect' CHECK(stage IN ('prospect','qualification','proposition','negociation','signe','perdu')),
  amount REAL DEFAULT 0,
  probability INTEGER DEFAULT 10 CHECK(probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  -- Type d'opportunité
  opportunity_type TEXT DEFAULT 'diagnostic' CHECK(opportunity_type IN ('diagnostic','repowering','amo','acquisition','formation','autre')),
  -- Source commerciale (mapping des 70 sources)
  source TEXT,
  source_category TEXT CHECK(source_category IN ('quick_win','automation','inbound','niche','institutionnel','financier','formation','autre')),
  -- Assignation
  assigned_to TEXT,
  -- Suivi
  next_action TEXT,
  next_action_date DATE,
  lost_reason TEXT,
  -- Métadonnées
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_opp_client ON crm_opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_opp_stage ON crm_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opp_type ON crm_opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_opp_close_date ON crm_opportunities(expected_close_date);

-- ============================================================================
-- 2. TABLE ACTIVITÉS COMMERCIALES (suivi interactions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS crm_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opportunity_id INTEGER,
  client_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL CHECK(activity_type IN ('appel','email','reunion','visite','devis','relance','note','autre')),
  subject TEXT NOT NULL,
  description TEXT,
  activity_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_minutes INTEGER,
  outcome TEXT,
  next_step TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES crm_clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_act_opp ON crm_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_act_client ON crm_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_act_date ON crm_activities(activity_date);

-- ============================================================================
-- 3. AJOUTER pipeline_stage À crm_clients (si pas déjà présent)
-- ============================================================================
-- SQLite ne supporte pas IF NOT EXISTS pour ALTER TABLE, on try/catch côté code
-- ALTER TABLE crm_clients ADD COLUMN pipeline_stage TEXT DEFAULT 'client';
