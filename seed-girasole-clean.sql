-- ======================================
-- SEED PRODUCTION: DONNÉES TEST GIRASOLE
-- ======================================

-- 1. CLIENT
INSERT OR REPLACE INTO crm_clients (id, company_name, client_type, status) 
VALUES (1, 'GIRASOLE Energies', 'client', 'active');

-- 2. PROJETS
INSERT OR REPLACE INTO projects (
  id, client_id, name, id_referent, site_address, 
  installation_power, audit_types, is_girasole
) VALUES 
  (59, 1, 'Centrale SOL 06 - Bouix', '31971', 'Bouix 11100', 250.0, '["CONFORMITE"]', 1),
  (60, 1, 'Centrale DOUBLE 01 - EARL CADOT', '32010', 'CADOT 34000', 300.0, '["CONFORMITE", "TOITURE"]', 1);

-- 3. INTERVENTIONS
INSERT OR REPLACE INTO interventions (
  id, project_id, intervention_date, intervention_type, status, notes
) VALUES
  (1, 59, '2025-01-15', 'audit_conformite', 'scheduled', 'Audit CONFORMITE SOL 06'),
  (2, 60, '2025-01-20', 'audit_complet', 'scheduled', 'Audit CONFORMITE + TOITURE DOUBLE 01');

-- 4. AUDITS
INSERT OR REPLACE INTO audits (
  audit_token, client_id, project_id, project_name, client_name, location, status
) VALUES 
  ('GIRASOLE-CONFORMITE-59-TEST', 1, 59, 'Centrale SOL 06 - Bouix', 'GIRASOLE Energies', 'Bouix', 'pending'),
  ('GIRASOLE-TOITURE-60-TEST', 1, 60, 'Centrale DOUBLE 01 - EARL CADOT', 'GIRASOLE Energies', 'CADOT', 'pending');

-- 5. INSPECTIONS CONFORMITE
INSERT OR REPLACE INTO visual_inspections (
  project_id, intervention_id, checklist_type, audit_token,
  inspection_type, notes, item_order, 
  audit_category, checklist_section, conformite
) VALUES 
  (59, 1, 'CONFORMITE', 'GIRASOLE-CONFORMITE-59-TEST',
   'CONF-01', '{"description": "Protection différentielle 30mA", "normReference": "NF C 15-100 Section 531.2"}',
   0, 'PROTECTIONS', 'Protection différentielle', 'conforme'),
  
  (59, 1, 'CONFORMITE', 'GIRASOLE-CONFORMITE-59-TEST',
   'CONF-02', '{"description": "Disjoncteur magnétothermique DC", "normReference": "NF C 15-100"}',
   1, 'PROTECTIONS', 'Disjoncteur DC', 'non_conforme'),
  
  (59, 1, 'CONFORMITE', 'GIRASOLE-CONFORMITE-59-TEST',
   'CONF-03', '{"description": "Continuité mise à la terre", "normReference": "NF C 15-100 Section 542.2"}',
   2, 'MISE_A_TERRE', 'Continuité terre', 'conforme'),
  
  (59, 1, 'CONFORMITE', 'GIRASOLE-CONFORMITE-59-TEST',
   'CONF-04', '{"description": "Câbles conformes UV", "normReference": "NF C 15-100"}',
   3, 'CABLAGE', 'Câbles DC', 'sans_objet'),
  
  (59, 1, 'CONFORMITE', 'GIRASOLE-CONFORMITE-59-TEST',
   'CONF-05', '{"description": "Serrage connecteurs MC4", "normReference": "NF C 15-100"}',
   4, 'CABLAGE', 'Connecteurs', 'conforme');

-- 6. INSPECTIONS TOITURE
INSERT OR REPLACE INTO visual_inspections (
  project_id, intervention_id, checklist_type, audit_token,
  inspection_type, notes, item_order,
  audit_category, checklist_section, conformite
) VALUES 
  (60, 2, 'TOITURE', 'GIRASOLE-TOITURE-60-TEST',
   'TOIT-01', '{"description": "État membrane étanchéité", "normReference": "DTU 40.35"}',
   0, 'ETANCHEITE', 'Membrane', 'conforme'),
  
  (60, 2, 'TOITURE', 'GIRASOLE-TOITURE-60-TEST',
   'TOIT-02', '{"description": "Traversées toiture", "normReference": "DTU 40.35"}',
   1, 'ETANCHEITE', 'Traversées', 'conforme'),
  
  (60, 2, 'TOITURE', 'GIRASOLE-TOITURE-60-TEST',
   'TOIT-05', '{"description": "Système fixation panneaux", "normReference": "DTU 40.35"}',
   2, 'FIXATIONS', 'Fixations', 'non_conforme');
