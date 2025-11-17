-- ============================================================================
-- DONNÉES DE TEST - Module Planning & CRM
-- ============================================================================

-- ============================================================================
-- 1. TECHNICIENS SOUS-TRAITANTS (auth_users)
-- ============================================================================

-- Technicien 1: Jean Martin
INSERT OR IGNORE INTO auth_users (email, password_hash, role, full_name, company, is_active, must_change_password)
VALUES ('jean.martin@diagpv-tech.fr', '$2b$10$dummyhash1234567890123456789012', 'subcontractor', 'Jean Martin', 'DiagPV Tech', 1, 0);

-- Technicien 2: Sophie Dubois
INSERT OR IGNORE INTO auth_users (email, password_hash, role, full_name, company, is_active, must_change_password)
VALUES ('sophie.dubois@diagpv-tech.fr', '$2b$10$dummyhash1234567890123456789012', 'subcontractor', 'Sophie Dubois', 'DiagPV Tech', 1, 0);

-- Technicien 3: Marc Lefebvre
INSERT OR IGNORE INTO auth_users (email, password_hash, role, full_name, company, is_active, must_change_password)
VALUES ('marc.lefebvre@diagpv-tech.fr', '$2b$10$dummyhash1234567890123456789012', 'subcontractor', 'Marc Lefebvre', 'DiagPV Tech', 1, 0);

-- ============================================================================
-- 2. CLIENTS CRM
-- ============================================================================

-- Client 1: Mairie de Toulouse
INSERT OR IGNORE INTO crm_clients (
  company_name, client_type, siret, address, postal_code, city, country,
  main_contact_name, main_contact_email, main_contact_phone, status
) VALUES (
  'Mairie de Toulouse', 'public', '21310555600013', 
  '1 Place du Capitole', '31000', 'Toulouse', 'France',
  'Pierre Durand', 'p.durand@toulouse.fr', '0561222222', 'active'
);

-- Client 2: EDF Énergies Renouvelables
INSERT OR IGNORE INTO crm_clients (
  company_name, client_type, siret, address, postal_code, city, country,
  main_contact_name, main_contact_email, main_contact_phone, status
) VALUES (
  'EDF Énergies Renouvelables', 'professional', '52850055900183',
  '20 Avenue de la Paix', '92400', 'Courbevoie', 'France',
  'Marie Laurent', 'm.laurent@edf-en.fr', '0149223344', 'active'
);

-- Client 3: Ferme Solaire du Midi
INSERT OR IGNORE INTO crm_clients (
  company_name, client_type, siret, address, postal_code, city, country,
  main_contact_name, main_contact_email, main_contact_phone, status
) VALUES (
  'Ferme Solaire du Midi', 'professional', '85234567800012',
  'Route de Carcassonne', '11000', 'Carcassonne', 'France',
  'Thomas Bernard', 't.bernard@fsmidi.fr', '0468445566', 'active'
);

-- ============================================================================
-- 3. PROJETS (CENTRALES PV)
-- ============================================================================

-- Projet 1: Centrale Capitole (Mairie Toulouse)
INSERT OR IGNORE INTO projects (
  client_id, name, site_address, installation_power, total_modules, 
  string_count, modules_per_string, commissioning_date, inverter_model
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'Mairie de Toulouse'),
  'Centrale PV Capitole', '1 Place du Capitole, 31000 Toulouse',
  250.0, 625, 25, 25, '2023-06-15', 'Fronius Symo 20.0-3'
);

-- Projet 2: Parc Solaire Courbevoie (EDF)
INSERT OR IGNORE INTO projects (
  client_id, name, site_address, installation_power, total_modules,
  string_count, modules_per_string, commissioning_date, inverter_model
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'EDF Énergies Renouvelables'),
  'Parc Solaire Courbevoie', 'Zone Industrielle, 92400 Courbevoie',
  1500.0, 3750, 125, 30, '2022-09-01', 'SMA Sunny Central 500'
);

-- Projet 3: Installation Hôtel de Ville (Mairie Toulouse)
INSERT OR IGNORE INTO projects (
  client_id, name, site_address, installation_power, total_modules,
  string_count, modules_per_string, commissioning_date, inverter_model
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'Mairie de Toulouse'),
  'Installation Hôtel de Ville', 'Place du Capitole, 31000 Toulouse',
  150.0, 375, 15, 25, '2024-01-10', 'SolarEdge SE15K'
);

-- Projet 4: Ferme Agrivoltaïque Carcassonne
INSERT OR IGNORE INTO projects (
  client_id, name, site_address, installation_power, total_modules,
  string_count, modules_per_string, commissioning_date, inverter_model
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'Ferme Solaire du Midi'),
  'Ferme Agrivoltaïque Carcassonne', 'Route de Carcassonne, 11000',
  2000.0, 5000, 200, 25, '2023-12-01', 'Huawei SUN2000-100KTL'
);

-- Projet 5: Extension Parc EDF
INSERT OR IGNORE INTO projects (
  client_id, name, site_address, installation_power, total_modules,
  string_count, modules_per_string, inverter_model
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'EDF Énergies Renouvelables'),
  'Extension Parc Solaire', 'Zone Industrielle Nord, 92400 Courbevoie',
  800.0, 2000, 80, 25, 'Sungrow SG110CX'
);

-- ============================================================================
-- 4. INTERVENTIONS PLANIFIÉES
-- ============================================================================

-- Intervention 1: Audit EL Centrale Capitole - Jean Martin - PLANIFIÉE
INSERT OR IGNORE INTO interventions (
  project_id, technician_id, intervention_type, intervention_date, 
  duration_hours, status, description
) VALUES (
  (SELECT id FROM projects WHERE name = 'Centrale PV Capitole'),
  (SELECT id FROM auth_users WHERE email = 'jean.martin@diagpv-tech.fr'),
  'el_audit', '2025-11-20', 6.0, 'scheduled',
  'Audit électroluminescence nocturne - 625 modules - Accès toiture validé'
);

-- Intervention 2: Test I-V Parc Courbevoie - Sophie Dubois - PLANIFIÉE
INSERT OR IGNORE INTO interventions (
  project_id, technician_id, intervention_type, intervention_date,
  duration_hours, status, description
) VALUES (
  (SELECT id FROM projects WHERE name = 'Parc Solaire Courbevoie'),
  (SELECT id FROM auth_users WHERE email = 'sophie.dubois@diagpv-tech.fr'),
  'iv_test', '2025-11-21', 8.0, 'scheduled',
  'Tests courbes I-V sur échantillon 150 modules - Équipement PVserv'
);

-- Intervention 3: Thermographie Hôtel de Ville - Marc Lefebvre - EN COURS
INSERT OR IGNORE INTO interventions (
  project_id, technician_id, intervention_type, intervention_date,
  duration_hours, status, description
) VALUES (
  (SELECT id FROM projects WHERE name = 'Installation Hôtel de Ville'),
  (SELECT id FROM auth_users WHERE email = 'marc.lefebvre@diagpv-tech.fr'),
  'thermography', '2025-11-17', 4.0, 'in_progress',
  'Thermographie drone - Détection points chauds - Vol autorisé'
);

-- Intervention 4: Inspection Visuelle Ferme Agrivoltaïque - NON ASSIGNÉE
INSERT OR IGNORE INTO interventions (
  project_id, technician_id, intervention_type, intervention_date,
  duration_hours, status, description
) VALUES (
  (SELECT id FROM projects WHERE name = 'Ferme Agrivoltaïque Carcassonne'),
  NULL, 'visual_inspection', '2025-11-22', 5.0, 'scheduled',
  'Inspection visuelle post-tempête - Vérification intégrité mécanique'
);

-- Intervention 5: Commissioning Extension Parc - NON ASSIGNÉE
INSERT OR IGNORE INTO interventions (
  project_id, technician_id, intervention_type, intervention_date,
  duration_hours, status, description
) VALUES (
  (SELECT id FROM projects WHERE name = 'Extension Parc Solaire'),
  NULL, 'commissioning', '2025-11-25', 10.0, 'scheduled',
  'Commissioning complet - Tests réception - 2000 modules neufs'
);

-- Intervention 6: Maintenance Centrale Capitole - Jean Martin - TERMINÉE
INSERT OR IGNORE INTO interventions (
  project_id, technician_id, intervention_type, intervention_date,
  duration_hours, status, description, notes
) VALUES (
  (SELECT id FROM projects WHERE name = 'Centrale PV Capitole'),
  (SELECT id FROM auth_users WHERE email = 'jean.martin@diagpv-tech.fr'),
  'maintenance', '2025-11-10', 3.0, 'completed',
  'Maintenance préventive trimestrielle',
  'Nettoyage modules OK - Vérification onduleurs OK - RAS'
);

-- Intervention 7: Audit EL Parc Courbevoie - Sophie Dubois - PLANIFIÉE (CONFLIT avec #2)
INSERT OR IGNORE INTO interventions (
  project_id, technician_id, intervention_type, intervention_date,
  duration_hours, status, description
) VALUES (
  (SELECT id FROM projects WHERE name = 'Parc Solaire Courbevoie'),
  (SELECT id FROM auth_users WHERE email = 'sophie.dubois@diagpv-tech.fr'),
  'el_audit', '2025-11-21', 10.0, 'scheduled',
  'CONFLIT VOLONTAIRE: Même technicien, même date que intervention #2'
);

-- Intervention 8: Test Isolation Extension Parc - Marc Lefebvre - PLANIFIÉE
INSERT OR IGNORE INTO interventions (
  project_id, technician_id, intervention_type, intervention_date,
  duration_hours, status, description
) VALUES (
  (SELECT id FROM projects WHERE name = 'Extension Parc Solaire'),
  (SELECT id FROM auth_users WHERE email = 'marc.lefebvre@diagpv-tech.fr'),
  'isolation_test', '2025-11-23', 4.0, 'scheduled',
  'Tests isolation électrique - Vérification conformité NF C 15-100'
);

-- Intervention 9: Expertise Post-Sinistre Ferme - NON ASSIGNÉE
INSERT OR IGNORE INTO interventions (
  project_id, technician_id, intervention_type, intervention_date,
  duration_hours, status, description
) VALUES (
  (SELECT id FROM projects WHERE name = 'Ferme Agrivoltaïque Carcassonne'),
  NULL, 'post_incident', '2025-11-28', 6.0, 'scheduled',
  'Expertise judiciaire suite grêle du 15/11 - Rapport assuré requis'
);

-- Intervention 10: Audit EL Hôtel de Ville - Jean Martin - ANNULÉE
INSERT OR IGNORE INTO interventions (
  project_id, technician_id, intervention_type, intervention_date,
  duration_hours, status, description, notes
) VALUES (
  (SELECT id FROM projects WHERE name = 'Installation Hôtel de Ville'),
  (SELECT id FROM auth_users WHERE email = 'jean.martin@diagpv-tech.fr'),
  'el_audit', '2025-11-15', 4.0, 'cancelled',
  'Audit EL reporté',
  'Annulé: Conditions météo défavorables - Reprogrammé 2025-12-05'
);
