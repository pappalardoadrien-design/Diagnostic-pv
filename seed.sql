-- Données de test pour DiagPV Audit EL
-- Insertion d'un audit de démonstration

INSERT OR IGNORE INTO audits (
  token, project_name, client_name, location, 
  string_count, modules_per_string, total_modules,
  created_at, status
) VALUES (
  'demo-audit-2024-test',
  'ARKOLIA-BONNAUD-DEMO',
  'Arkolia Energies',
  'Bonnaud Solar Park',
  4,
  20,
  80,
  datetime('now'),
  'in_progress'
);

-- Insertion modules de test avec différents statuts
INSERT OR IGNORE INTO modules (audit_token, module_id, string_number, position_in_string, status, comment) VALUES
-- String 1
('demo-audit-2024-test', 'M001', 1, 1, 'ok', NULL),
('demo-audit-2024-test', 'M002', 1, 2, 'ok', NULL),
('demo-audit-2024-test', 'M003', 1, 3, 'inequality', 'Légère inégalité EL'),
('demo-audit-2024-test', 'M004', 1, 4, 'ok', NULL),
('demo-audit-2024-test', 'M005', 1, 5, 'microcracks', 'Microfissures visibles'),
('demo-audit-2024-test', 'M006', 1, 6, 'ok', NULL),
('demo-audit-2024-test', 'M007', 1, 7, 'ok', NULL),
('demo-audit-2024-test', 'M008', 1, 8, 'dead', 'Module complètement HS'),
('demo-audit-2024-test', 'M009', 1, 9, 'ok', NULL),
('demo-audit-2024-test', 'M010', 1, 10, 'ok', NULL),
('demo-audit-2024-test', 'M011', 1, 11, 'ok', NULL),
('demo-audit-2024-test', 'M012', 1, 12, 'ok', NULL),
('demo-audit-2024-test', 'M013', 1, 13, 'ok', NULL),
('demo-audit-2024-test', 'M014', 1, 14, 'ok', NULL),
('demo-audit-2024-test', 'M015', 1, 15, 'ok', NULL),
('demo-audit-2024-test', 'M016', 1, 16, 'ok', NULL),
('demo-audit-2024-test', 'M017', 1, 17, 'ok', NULL),
('demo-audit-2024-test', 'M018', 1, 18, 'ok', NULL),
('demo-audit-2024-test', 'M019', 1, 19, 'ok', NULL),
('demo-audit-2024-test', 'M020', 1, 20, 'ok', NULL),

-- String 2
('demo-audit-2024-test', 'M021', 2, 1, 'ok', NULL),
('demo-audit-2024-test', 'M022', 2, 2, 'inequality', 'Cellules inégales'),
('demo-audit-2024-test', 'M023', 2, 3, 'ok', NULL),
('demo-audit-2024-test', 'M024', 2, 4, 'ok', NULL),
('demo-audit-2024-test', 'M025', 2, 5, 'ok', NULL),
('demo-audit-2024-test', 'M026', 2, 6, 'string_open', 'String ouvert détecté'),
('demo-audit-2024-test', 'M027', 2, 7, 'ok', NULL),
('demo-audit-2024-test', 'M028', 2, 8, 'ok', NULL),
('demo-audit-2024-test', 'M029', 2, 9, 'ok', NULL),
('demo-audit-2024-test', 'M030', 2, 10, 'ok', NULL),
('demo-audit-2024-test', 'M031', 2, 11, 'ok', NULL),
('demo-audit-2024-test', 'M032', 2, 12, 'ok', NULL),
('demo-audit-2024-test', 'M033', 2, 13, 'ok', NULL),
('demo-audit-2024-test', 'M034', 2, 14, 'ok', NULL),
('demo-audit-2024-test', 'M035', 2, 15, 'ok', NULL),
('demo-audit-2024-test', 'M036', 2, 16, 'ok', NULL),
('demo-audit-2024-test', 'M037', 2, 17, 'ok', NULL),
('demo-audit-2024-test', 'M038', 2, 18, 'ok', NULL),
('demo-audit-2024-test', 'M039', 2, 19, 'ok', NULL),
('demo-audit-2024-test', 'M040', 2, 20, 'ok', NULL),

-- String 3
('demo-audit-2024-test', 'M041', 3, 1, 'ok', NULL),
('demo-audit-2024-test', 'M042', 3, 2, 'ok', NULL),
('demo-audit-2024-test', 'M043', 3, 3, 'ok', NULL),
('demo-audit-2024-test', 'M044', 3, 4, 'ok', NULL),
('demo-audit-2024-test', 'M045', 3, 5, 'ok', NULL),
('demo-audit-2024-test', 'M046', 3, 6, 'ok', NULL),
('demo-audit-2024-test', 'M047', 3, 7, 'not_connected', 'Non raccordé'),
('demo-audit-2024-test', 'M048', 3, 8, 'ok', NULL),
('demo-audit-2024-test', 'M049', 3, 9, 'ok', NULL),
('demo-audit-2024-test', 'M050', 3, 10, 'ok', NULL),
('demo-audit-2024-test', 'M051', 3, 11, 'ok', NULL),
('demo-audit-2024-test', 'M052', 3, 12, 'ok', NULL),
('demo-audit-2024-test', 'M053', 3, 13, 'ok', NULL),
('demo-audit-2024-test', 'M054', 3, 14, 'ok', NULL),
('demo-audit-2024-test', 'M055', 3, 15, 'ok', NULL),
('demo-audit-2024-test', 'M056', 3, 16, 'ok', NULL),
('demo-audit-2024-test', 'M057', 3, 17, 'ok', NULL),
('demo-audit-2024-test', 'M058', 3, 18, 'ok', NULL),
('demo-audit-2024-test', 'M059', 3, 19, 'ok', NULL),
('demo-audit-2024-test', 'M060', 3, 20, 'ok', NULL),

-- String 4
('demo-audit-2024-test', 'M061', 4, 1, 'ok', NULL),
('demo-audit-2024-test', 'M062', 4, 2, 'ok', NULL),
('demo-audit-2024-test', 'M063', 4, 3, 'ok', NULL),
('demo-audit-2024-test', 'M064', 4, 4, 'ok', NULL),
('demo-audit-2024-test', 'M065', 4, 5, 'ok', NULL),
('demo-audit-2024-test', 'M066', 4, 6, 'ok', NULL),
('demo-audit-2024-test', 'M067', 4, 7, 'ok', NULL),
('demo-audit-2024-test', 'M068', 4, 8, 'ok', NULL),
('demo-audit-2024-test', 'M069', 4, 9, 'ok', NULL),
('demo-audit-2024-test', 'M070', 4, 10, 'ok', NULL),
('demo-audit-2024-test', 'M071', 4, 11, 'ok', NULL),
('demo-audit-2024-test', 'M072', 4, 12, 'ok', NULL),
('demo-audit-2024-test', 'M073', 4, 13, 'ok', NULL),
('demo-audit-2024-test', 'M074', 4, 14, 'ok', NULL),
('demo-audit-2024-test', 'M075', 4, 15, 'ok', NULL),
('demo-audit-2024-test', 'M076', 4, 16, 'ok', NULL),
('demo-audit-2024-test', 'M077', 4, 17, 'ok', NULL),
('demo-audit-2024-test', 'M078', 4, 18, 'ok', NULL),
('demo-audit-2024-test', 'M079', 4, 19, 'ok', NULL),
('demo-audit-2024-test', 'M080', 4, 20, 'pending', NULL);

-- Données PVserv de test
INSERT OR IGNORE INTO pvserv_measurements (
  audit_token, string_number, module_number, 
  ff, rds, uf, measurement_type, iv_curve_data
) VALUES 
('demo-audit-2024-test', 1, 1, 0.957, 17.20, 772, 'bright', '212 0.00 339 0.00'),
('demo-audit-2024-test', 1, 2, 0.943, 18.45, 768, 'bright', '215 0.00 341 0.00'),
('demo-audit-2024-test', 2, 1, 0.951, 17.89, 770, 'bright', '213 0.00 340 0.00');