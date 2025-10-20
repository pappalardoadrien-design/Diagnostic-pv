-- Données de test pour le HUB Diagnostic Photovoltaïque

-- Utilisateurs (équipe DiagPV)
INSERT OR IGNORE INTO users (email, name, role, certification_level) VALUES 
  ('adrien@diagpv.com', 'Adrien Dubois', 'admin', 'N3'),
  ('tech1@diagpv.com', 'Marc Leclerc', 'technician', 'N2'),
  ('tech2@diagpv.com', 'Sophie Martin', 'technician', 'N2'),
  ('manager@diagpv.com', 'Pierre Moreau', 'manager', 'N3');

-- Clients
INSERT OR IGNORE INTO clients (name, contact_email, contact_phone, address, siret) VALUES 
  ('SARL Énergies Vertes', 'contact@energiesvertes.fr', '0145678901', '12 Avenue Verte, 75001 Paris', '12345678901234'),
  ('Mairie de Solville', 'mairie@solville.fr', '0298765432', 'Place de la République, 29000 Solville', '98765432109876'),
  ('Copropriété Les Terrasses', 'syndic@lesterrasses.fr', '0434567890', '45 Rue du Soleil, 13000 Marseille', '45678901234567');

-- Projets
INSERT OR IGNORE INTO projects (client_id, name, site_address, installation_power, installation_date, installer_company, inverter_brand, inverter_model, module_brand, module_model, module_count) VALUES 
  (1, 'Installation Toiture Entreprise', '12 Avenue Verte, 75001 Paris', 50.4, '2023-03-15', 'SolarTech Pro', 'SMA', 'STP50-40', 'Photowatt', 'PW-280P', 180),
  (2, 'Centrale Communale', 'École Primaire, 29000 Solville', 100.8, '2022-09-20', 'Énergies du Futur', 'Fronius', 'Symo 20.0-3-M', 'Canadian Solar', 'CS3K-300MS', 336),
  (3, 'Toitures Copropriété', '45 Rue du Soleil, 13000 Marseille', 25.2, '2024-01-10', 'Sud Solar', 'Huawei', 'SUN2000-25KTL-M3', 'JinkoSolar', 'Tiger Neo 420W', 60);

-- Modules (exemple pour projet 1 - matrice 12x15)
INSERT OR IGNORE INTO modules (project_id, module_identifier, physical_row, physical_col, string_number, position_in_string) VALUES 
  -- String 1 (rangée 1, colonnes 1-15)
  (1, '1A01', 1, 1, 1, 1), (1, '1A02', 1, 2, 1, 2), (1, '1A03', 1, 3, 1, 3), (1, '1A04', 1, 4, 1, 4), (1, '1A05', 1, 5, 1, 5),
  (1, '1A06', 1, 6, 1, 6), (1, '1A07', 1, 7, 1, 7), (1, '1A08', 1, 8, 1, 8), (1, '1A09', 1, 9, 1, 9), (1, '1A10', 1, 10, 1, 10),
  (1, '1A11', 1, 11, 1, 11), (1, '1A12', 1, 12, 1, 12), (1, '1A13', 1, 13, 1, 13), (1, '1A14', 1, 14, 1, 14), (1, '1A15', 1, 15, 1, 15),
  -- String 2 (rangée 2, colonnes 1-15)
  (1, '2B01', 2, 1, 2, 1), (1, '2B02', 2, 2, 2, 2), (1, '2B03', 2, 3, 2, 3), (1, '2B04', 2, 4, 2, 4), (1, '2B05', 2, 5, 2, 5),
  (1, '2B06', 2, 6, 2, 6), (1, '2B07', 2, 7, 2, 7), (1, '2B08', 2, 8, 2, 8), (1, '2B09', 2, 9, 2, 9), (1, '2B10', 2, 10, 2, 10),
  (1, '2B11', 2, 11, 2, 11), (1, '2B12', 2, 12, 2, 12), (1, '2B13', 2, 13, 2, 13), (1, '2B14', 2, 14, 2, 14), (1, '2B15', 2, 15, 2, 15);

-- Interventions
INSERT OR IGNORE INTO interventions (project_id, technician_id, intervention_type, scheduled_date, completion_date, status, weather_conditions, irradiance_level, ambient_temperature, notes) VALUES 
  (1, 2, 'audit_N2', '2024-10-20', NULL, 'planned', NULL, NULL, NULL, 'Audit complet électroluminescence + thermographie'),
  (2, 3, 'commissioning', '2024-10-25', NULL, 'planned', NULL, NULL, NULL, 'Commissioning indépendant post-installation'),
  (3, 2, 'post_sinistre', '2024-10-18', '2024-10-18', 'completed', 'Ensoleillé', 850, 25.5, 'Expertise suite grêle du 15/10');

-- Mesures électroluminescence (exemples)
INSERT OR IGNORE INTO el_measurements (intervention_id, module_id, defect_type, severity_level, current_injection, exposure_time, notes) VALUES 
  (3, 1, 'crack', 'medium', 8.5, 30, 'Microfissure visible coin supérieur droit'),
  (3, 2, 'hotspot', 'high', 8.5, 30, 'Point chaud détecté cellule C3'),
  (3, 16, 'pid', 'low', 8.5, 30, 'Début de dégradation induite potentiel');

-- Mesures thermographiques
INSERT OR IGNORE INTO thermal_measurements (intervention_id, module_id, measurement_type, temperature_max, temperature_min, temperature_avg, delta_temp, thermal_anomaly, irradiance_at_measurement, wind_speed, notes) VALUES 
  (3, 1, 'drone', 65.2, 58.1, 61.5, 12.3, TRUE, 820, 2.1, 'Surchauffe significative détectée'),
  (3, 2, 'drone', 72.8, 59.2, 64.1, 19.5, TRUE, 820, 2.1, 'Point chaud critique - intervention requise');

-- Tests isolement
INSERT OR IGNORE INTO isolation_tests (intervention_id, test_type, test_voltage, resistance_value, compliance_status, min_required_resistance, temperature_at_test, notes) VALUES 
  (3, 'dc_isolation', 500, 15.2, TRUE, 1.0, 24.5, 'Conformité NFC 15-100 respectée'),
  (3, 'ac_isolation', 500, 8.7, TRUE, 1.0, 24.5, 'Isolement AC satisfaisant');

-- Contrôles visuels
INSERT OR IGNORE INTO visual_inspections (intervention_id, module_id, inspection_category, defect_found, defect_description, severity_assessment, corrective_action_required, inspector_notes) VALUES 
  (3, 1, 'mechanical', TRUE, 'Fissure cadre aluminium suite impact grêle', 'major', TRUE, 'Remplacement module recommandé'),
  (3, 2, 'electrical', TRUE, 'Connecteur MC4 corrodé', 'medium', TRUE, 'Nettoyage et remplacement connecteur');

-- Expertise post-sinistre
INSERT OR IGNORE INTO post_incident_expertise (intervention_id, incident_type, incident_date, insurance_company, claim_number, damage_assessment, estimated_loss_kwh, estimated_loss_euros, replacement_cost, repair_feasibility, expert_conclusions) VALUES 
  (3, 'hail', '2024-10-15', 'Allianz', 'AL-2024-156789', 'Dommages modérés sur 15% des modules', 2400, 720, 8500, 'feasible', 'Réparation recommandée - modules endommagés identifiés précisément');

-- Rapports
INSERT OR IGNORE INTO reports (intervention_id, report_type, report_title, executive_summary, report_file_path, client_validation) VALUES 
  (3, 'expertise', 'Expertise Post-Sinistre Grêle - Les Terrasses', 'Expertise réalisée suite aux intempéries du 15/10/2024. Dommages identifiés sur 9 modules (15% installation). Impact production estimé à 2400 kWh/an soit 720€/an. Réparation techniquement et économiquement justifiée.', '/reports/expertise_lesterrasses_20241018.pdf', FALSE);