-- SEED DONNÉES TEST GIRASOLE POUR PRODUCTION
-- Project: EARL CADOT (ID 5, ID_Referent 32010)
-- Audit Token: GIRASOLE-89219-20251120

-- ==========================================
-- INSPECTIONS CONFORMITE (NF C 15-100)
-- ==========================================

INSERT INTO visual_inspections (
  project_id,
  checklist_type,
  audit_token,
  inspection_type,
  notes,
  item_order,
  audit_category,
  checklist_section,
  conformite
) VALUES 
-- PROTECTIONS
(5, 'CONFORMITE', 'GIRASOLE-89219-20251120', 'CONF-01', 
 '{"description": "Protection différentielle 30mA présente et fonctionnelle", "normReference": "NF C 15-100 Section 531.2", "code": "PROT-01"}',
 0, 'PROTECTIONS', 'Protection différentielle', 'conforme'),

(5, 'CONFORMITE', 'GIRASOLE-89219-20251120', 'CONF-02', 
 '{"description": "Disjoncteur DC adapté à la puissance", "normReference": "NF C 15-100 Section 536", "code": "PROT-02"}',
 1, 'PROTECTIONS', 'Disjoncteur DC', 'conforme'),

-- MISE À LA TERRE
(5, 'CONFORMITE', 'GIRASOLE-89219-20251120', 'CONF-03', 
 '{"description": "Continuité liaison équipotentielle < 0.5 Ω", "normReference": "NF C 15-100 Section 543.1", "code": "TERRE-01"}',
 2, 'MISE_A_TERRE', 'Continuité terre', 'conforme'),

(5, 'CONFORMITE', 'GIRASOLE-89219-20251120', 'CONF-04', 
 '{"description": "Résistance de terre < 100 Ω", "normReference": "NF C 15-100 Section 542", "code": "TERRE-02"}',
 3, 'MISE_A_TERRE', 'Résistance terre', 'non_conforme'),

-- CÂBLAGE
(5, 'CONFORMITE', 'GIRASOLE-89219-20251120', 'CONF-05', 
 '{"description": "Section câbles DC conformes (6mm² min)", "normReference": "NF C 15-100 Section 523", "code": "CABL-01"}',
 4, 'CABLAGE', 'Section câbles', 'conforme'),

(5, 'CONFORMITE', 'GIRASOLE-89219-20251120', 'CONF-06', 
 '{"description": "Étiquetage câbles DC/AC conforme", "normReference": "UTE C 15-712-1", "code": "CABL-02"}',
 5, 'CABLAGE', 'Étiquetage', 'sans_objet');

-- ==========================================
-- INSPECTIONS TOITURE (DTU 40.35)
-- ==========================================

INSERT INTO visual_inspections (
  project_id,
  checklist_type,
  audit_token,
  inspection_type,
  notes,
  item_order,
  audit_category,
  checklist_section,
  conformite
) VALUES 
-- ÉTANCHÉITÉ
(5, 'TOITURE', 'GIRASOLE-89219-20251120', 'TOIT-01', 
 '{"description": "État membrane étanchéité - pas de déchirures", "normReference": "DTU 40.35 Article 5.2", "code": "ETAN-01"}',
 0, 'ETANCHEITE', 'Membrane', 'conforme'),

(5, 'TOITURE', 'GIRASOLE-89219-20251120', 'TOIT-02', 
 '{"description": "Traversées étanches (passe-câbles)", "normReference": "DTU 40.35 Article 7.3", "code": "ETAN-02"}',
 1, 'ETANCHEITE', 'Traversées', 'conforme'),

-- FIXATIONS
(5, 'TOITURE', 'GIRASOLE-89219-20251120', 'TOIT-03', 
 '{"description": "Système fixation adapté au support", "normReference": "DTU 40.35 Article 6.1", "code": "FIX-01"}',
 2, 'FIXATIONS', 'Système fixation', 'non_conforme'),

-- STRUCTURE
(5, 'TOITURE', 'GIRASOLE-89219-20251120', 'TOIT-04', 
 '{"description": "Rails aluminium sans corrosion", "normReference": "DTU 40.35 Article 6.2", "code": "STRUC-01"}',
 3, 'STRUCTURE', 'Rails', 'conforme');
