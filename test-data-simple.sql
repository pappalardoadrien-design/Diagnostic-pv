-- ============================================================================
-- DONNÉES DE TEST SIMPLIFIÉES - Module Planning
-- Utilise clients existants: TotalEnergies (1), EDF Renouvelables (2), Engie Green (3)
-- ============================================================================

-- ============================================================================
-- 1. TECHNICIENS SOUS-TRAITANTS
-- ============================================================================
INSERT OR IGNORE INTO auth_users (email, password_hash, role, full_name, company, is_active)
VALUES 
  ('jean.martin@diagpv-tech.fr', '$2b$10$dummyhash', 'subcontractor', 'Jean Martin', 'DiagPV Tech', 1),
  ('sophie.dubois@diagpv-tech.fr', '$2b$10$dummyhash', 'subcontractor', 'Sophie Dubois', 'DiagPV Tech', 1),
  ('marc.lefebvre@diagpv-tech.fr', '$2b$10$dummyhash', 'subcontractor', 'Marc Lefebvre', 'DiagPV Tech', 1);

-- ============================================================================
-- 2. PROJETS (utilise clients existants IDs 1, 2, 3)
-- ============================================================================
INSERT OR IGNORE INTO projects (client_id, name, site_address, installation_power, total_modules, string_count, modules_per_string)
VALUES 
  (1, 'Parc Solaire TotalEnergies Toulouse', 'Zone Industrielle Nord, 31000 Toulouse', 1200.0, 3000, 120, 25),
  (2, 'Centrale EDF Bordeaux', 'Quai de Bacalan, 33000 Bordeaux', 800.0, 2000, 80, 25),
  (3, 'Installation Engie Marseille', 'Port de la Joliette, 13002 Marseille', 500.0, 1250, 50, 25),
  (1, 'Extension TotalEnergies Lyon', 'Part-Dieu, 69003 Lyon', 600.0, 1500, 60, 25),
  (2, 'Parc EDF Nantes', 'Île de Nantes, 44000 Nantes', 1000.0, 2500, 100, 25);

-- ============================================================================
-- 3. INTERVENTIONS PLANIFIÉES (10 interventions variées)
-- ============================================================================

-- Intervention 1: Audit EL - Jean Martin - PLANIFIÉE
INSERT OR IGNORE INTO interventions (project_id, technician_id, intervention_type, intervention_date, duration_hours, status, description)
VALUES (1, (SELECT id FROM auth_users WHERE email = 'jean.martin@diagpv-tech.fr'), 'el_audit', '2025-11-20', 6.0, 'scheduled', 'Audit électroluminescence nocturne - 3000 modules');

-- Intervention 2: Test I-V - Sophie Dubois - PLANIFIÉE  
INSERT OR IGNORE INTO interventions (project_id, technician_id, intervention_type, intervention_date, duration_hours, status, description)
VALUES (2, (SELECT id FROM auth_users WHERE email = 'sophie.dubois@diagpv-tech.fr'), 'iv_test', '2025-11-21', 8.0, 'scheduled', 'Tests courbes I-V sur échantillon 150 modules');

-- Intervention 3: Thermographie - Marc Lefebvre - EN COURS
INSERT OR IGNORE INTO interventions (project_id, technician_id, intervention_type, intervention_date, duration_hours, status, description)
VALUES (3, (SELECT id FROM auth_users WHERE email = 'marc.lefebvre@diagpv-tech.fr'), 'thermography', '2025-11-17', 4.0, 'in_progress', 'Thermographie drone - Détection points chauds');

-- Intervention 4: Inspection Visuelle - NON ASSIGNÉE
INSERT OR IGNORE INTO interventions (project_id, technician_id, intervention_type, intervention_date, duration_hours, status, description)
VALUES (4, NULL, 'visual_inspection', '2025-11-22', 5.0, 'scheduled', 'Inspection visuelle post-tempête');

-- Intervention 5: Commissioning - NON ASSIGNÉE
INSERT OR IGNORE INTO interventions (project_id, technician_id, intervention_type, intervention_date, duration_hours, status, description)
VALUES (5, NULL, 'commissioning', '2025-11-25', 10.0, 'scheduled', 'Commissioning complet - Tests réception');

-- Intervention 6: Maintenance - Jean Martin - TERMINÉE
INSERT OR IGNORE INTO interventions (project_id, technician_id, intervention_type, intervention_date, duration_hours, status, description, notes)
VALUES (1, (SELECT id FROM auth_users WHERE email = 'jean.martin@diagpv-tech.fr'), 'maintenance', '2025-11-10', 3.0, 'completed', 'Maintenance préventive trimestrielle', 'Nettoyage modules OK - RAS');

-- Intervention 7: Audit EL - Sophie Dubois - PLANIFIÉE (CONFLIT avec #2 même date)
INSERT OR IGNORE INTO interventions (project_id, technician_id, intervention_type, intervention_date, duration_hours, status, description)
VALUES (3, (SELECT id FROM auth_users WHERE email = 'sophie.dubois@diagpv-tech.fr'), 'el_audit', '2025-11-21', 10.0, 'scheduled', 'CONFLIT: Même technicien, même date que intervention #2');

-- Intervention 8: Test Isolation - Marc Lefebvre - PLANIFIÉE
INSERT OR IGNORE INTO interventions (project_id, technician_id, intervention_type, intervention_date, duration_hours, status, description)
VALUES (5, (SELECT id FROM auth_users WHERE email = 'marc.lefebvre@diagpv-tech.fr'), 'isolation_test', '2025-11-23', 4.0, 'scheduled', 'Tests isolation électrique - NF C 15-100');

-- Intervention 9: Expertise Post-Sinistre - NON ASSIGNÉE
INSERT OR IGNORE INTO interventions (project_id, technician_id, intervention_type, intervention_date, duration_hours, status, description)
VALUES (4, NULL, 'post_incident', '2025-11-28', 6.0, 'scheduled', 'Expertise judiciaire suite grêle - Rapport assuré requis');

-- Intervention 10: Audit EL - Jean Martin - ANNULÉE
INSERT OR IGNORE INTO interventions (project_id, technician_id, intervention_type, intervention_date, duration_hours, status, description, notes)
VALUES (2, (SELECT id FROM auth_users WHERE email = 'jean.martin@diagpv-tech.fr'), 'el_audit', '2025-11-15', 4.0, 'cancelled', 'Audit EL reporté', 'Annulé: Conditions météo - Reprogrammé 2025-12-05');
