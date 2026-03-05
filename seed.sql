-- ============================================================================
-- SEED DATA - Diagnostic PV Hub
-- Base de test professionnelle pour tous les modules
-- ============================================================================

-- Desactiver FK temporairement pour le seeding
PRAGMA foreign_keys = OFF;

-- 1. Clients legacy (table clients - FK pour projects)
INSERT OR IGNORE INTO clients (id, name, contact_email, siret, notes) VALUES
(1, 'SolarTest SAS', 'contact@solartest.fr', '98765432100012', 'Client de test - Plateforme DiagPV');

-- 1b. CRM : Client de test (table crm_clients - nouveau CRM)
INSERT OR IGNORE INTO crm_clients (
  id, company_name, client_type, siret, address, postal_code, city, country,
  main_contact_name, main_contact_email, main_contact_phone,
  status, acquisition_source, notes
) VALUES (
  1, 'SolarTest SAS', 'professional', '98765432100012',
  '3 Rue Apollo', '31240', 'L''Union', 'France',
  'Thomas Martin', 'contact@solartest.fr', '05 61 00 00 00',
  'active', 'direct', 'Client de test - Plateforme DiagPV'
);

-- 2. Projet de test
INSERT OR IGNORE INTO projects (
  id, client_id, name, site_address, installation_power,
  module_model, inverter_model, installation_date,
  string_count, modules_per_string, total_modules,
  latitude, longitude, status, total_power_kwp, module_count,
  address_city, notes
) VALUES (
  1, 1, 'Centrale PV JALIBAT', 'ZI de Jalibat', 250,
  'Trina Solar TSM-DE09.08 400W', 'Huawei SUN2000-60KTL-M0', '2019-06-15',
  12, 20, 240,
  43.6047, 1.4442, 'active', 250, 240,
  'Toulouse', 'Centrale sol 250 kWc - Installation 2019'
);

-- 3. PV Plants (cartographie)
INSERT OR IGNORE INTO pv_plants (
  id, plant_name, plant_type, total_power_kwp, module_count, city, address
) VALUES (
  1, 'Centrale PV JALIBAT', 'ground', 250, 240, 'Toulouse', 'ZI de Jalibat'
);

-- 4. EL Audit de test
INSERT OR IGNORE INTO el_audits (
  id, audit_token, project_name, client_name, location,
  string_count, modules_per_string, total_modules,
  status, completion_rate, plant_id, audit_date
) VALUES (
  1, 'EL-JALIBAT-2026', 'Centrale PV JALIBAT', 'SolarTest SAS', 'Toulouse - ZI Jalibat',
  12, 20, 240,
  'in_progress', 45.5, 1, '2026-03-01'
);

-- 5. Liaison PV <-> EL audit
INSERT OR IGNORE INTO pv_cartography_audit_links (
  pv_plant_id, el_audit_token, link_type, sync_status
) VALUES (
  1, 'EL-JALIBAT-2026', 'import_config', 'synced'
);

-- 6. Modules EL - Echantillon representatif (24 modules sur 240)
INSERT OR IGNORE INTO el_modules (audit_token, module_identifier, string_number, position_in_string, defect_type, severity_level, comment) VALUES
('EL-JALIBAT-2026', 'S1-M01', 1, 1, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S1-M02', 1, 2, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S1-M03', 1, 3, 'microcracks', 1, 'Microfissures mineures coin sup droit'),
('EL-JALIBAT-2026', 'S1-M04', 1, 4, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S1-M05', 1, 5, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S1-M06', 1, 6, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S2-M01', 2, 1, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S2-M02', 2, 2, 'inequality', 1, 'Inegalite luminescence cellule 3'),
('EL-JALIBAT-2026', 'S2-M03', 2, 3, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S2-M04', 2, 4, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S2-M05', 2, 5, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S2-M06', 2, 6, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S3-M01', 3, 1, 'microcracks', 2, 'Microfissures multiples'),
('EL-JALIBAT-2026', 'S3-M02', 3, 2, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S3-M03', 3, 3, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S3-M04', 3, 4, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S3-M05', 3, 5, 'dead', 3, 'Module HS - aucune luminescence'),
('EL-JALIBAT-2026', 'S3-M06', 3, 6, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S4-M01', 4, 1, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S4-M02', 4, 2, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S4-M03', 4, 3, 'microcracks', 1, 'Microfissures mineures'),
('EL-JALIBAT-2026', 'S4-M04', 4, 4, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S4-M05', 4, 5, 'ok', 0, 'RAS'),
('EL-JALIBAT-2026', 'S4-M06', 4, 6, 'string_open', 3, 'String ouvert - connexion defaillante');

-- 7. Courbes IV test (4 strings)
INSERT OR IGNORE INTO iv_curves (
  audit_token, string_number, curve_type, device_name, serial_number,
  fill_factor, rds, uf_diodes, status, anomaly_detected, source_filename
) VALUES
('EL-JALIBAT-2026', 1, 'dark', 'PVServ 5.0', 'PVS-2024-001', 0.957, 17.2, 772, 'completed', 0, 'JALIBAT_S1.txt'),
('EL-JALIBAT-2026', 2, 'dark', 'PVServ 5.0', 'PVS-2024-001', 0.943, 18.4, 768, 'completed', 0, 'JALIBAT_S2.txt'),
('EL-JALIBAT-2026', 3, 'dark', 'PVServ 5.0', 'PVS-2024-001', 0.891, 23.1, 755, 'completed', 1, 'JALIBAT_S3.txt'),
('EL-JALIBAT-2026', 4, 'dark', 'PVServ 5.0', 'PVS-2024-001', 0.951, 17.9, 770, 'completed', 0, 'JALIBAT_S4.txt');

-- 8. Tests isolation (3 tests)
INSERT OR IGNORE INTO isolation_tests (
  test_token, plant_id, audit_el_token, test_date, test_type,
  operator_name, equipment_used,
  dc_positive_to_earth, dc_negative_to_earth, dc_positive_to_negative, ac_to_earth,
  temperature_celsius, humidity_percent, weather_conditions,
  is_conform, threshold_mohm, notes
) VALUES
('ISO-JALIBAT-001', 1, 'EL-JALIBAT-2026', '2026-03-01', 'initial',
 'Adrien PAPPALARDO', 'Megger MIT485',
 450.5, 380.2, 520.1, 290.3,
 22, 45, 'Ensoleille',
 1, 1.0, 'Test isolement initial - Conforme IEC 62446'),
('ISO-JALIBAT-002', 1, 'EL-JALIBAT-2026', '2026-03-01', 'initial',
 'Adrien PAPPALARDO', 'Megger MIT485',
 0.8, 0.6, 1.2, 0.5,
 12, 65, 'Couvert',
 0, 1.0, 'Non conforme - Valeurs sous seuil 1 MOhm'),
('ISO-JALIBAT-003', 1, 'EL-JALIBAT-2026', '2026-03-02', 'periodic',
 'Adrien PAPPALARDO', 'Megger MIT485',
 520.0, 490.0, 610.0, 350.0,
 18, 50, 'Partiellement nuageux',
 1, 1.0, 'Test periodique - Conforme');

-- 9. Intervention de test (AVANT thermal car FK)
INSERT OR IGNORE INTO interventions (
  id, project_id, technician_id, intervention_type, intervention_date,
  duration_hours, status, weather_conditions, temperature_ambient, irradiance, notes
) VALUES (
  1, 1, NULL, 'audit_complet', '2026-03-01',
  8, 'completed', 'Ensoleille', 22, 850, 'Audit complet Centrale JALIBAT - EL + IV + Thermique + Isolation'
);

-- 10. Mesures thermiques (2 mesures)
INSERT OR IGNORE INTO thermal_measurements (
  intervention_id, measurement_method, temperature_max, temperature_min, temperature_avg,
  delta_t_max, string_number, module_number, defect_type, severity_level, notes
) VALUES
(1, 'drone', 85.3, 35.2, 42.1, 50.1, 3, 5, 'hotspot', 4, 'Hotspot critique S3-M05 - Module HS confirme'),
(1, 'drone', 52.1, 34.8, 40.5, 17.3, 2, 2, 'cell_mismatch', 2, 'Mismatch cellulaire mineur S2-M02');

-- 11. Diode Test Session
INSERT OR IGNORE INTO diode_test_sessions (
  audit_token, plant_id, project_id, session_token,
  technician_name, test_date, method, equipment,
  ambient_temperature, irradiance,
  total_diodes_tested, diodes_ok, diodes_defective, diodes_suspect,
  conformity_rate, status, notes
) VALUES (
  'EL-JALIBAT-2026', 1, 1, 'DIO-JALIBAT-001',
  'Adrien PAPPALARDO', '2026-03-01', 'thermal', 'Camera FLIR T540',
  22, 850,
  72, 69, 2, 1,
  95.83, 'completed', 'Test diodes bypass - 72 diodes testees sur 24 modules'
);

-- 11b. Diode Test Results
INSERT OR IGNORE INTO diode_test_results (
  session_id, module_identifier, diode_position, status,
  defect_type, severity, temperature_diode, delta_t, observation
) VALUES
(1, 'S3-M05', 'D1', 'defective', 'open_circuit', 'critical', 92.5, 57.3, 'Diode bypass D1 defaillante - circuit ouvert'),
(1, 'S3-M05', 'D2', 'defective', 'short_circuit', 'major', 78.2, 43.0, 'Diode bypass D2 en court-circuit'),
(1, 'S2-M02', 'D1', 'suspect', 'high_resistance', 'minor', 55.0, 19.8, 'Resistance elevee - Surveillance recommandee');

-- Reactiver FK
PRAGMA foreign_keys = ON;

-- ============================================================================
-- FIN SEED
-- ============================================================================
