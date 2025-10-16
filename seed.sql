-- Base de test épurée DiagPV Audit EL  
-- Audit de démonstration professionnel

-- Audit principal de démonstration
INSERT OR IGNORE INTO audits (
  token, project_name, client_name, location, 
  string_count, modules_per_string, total_modules,
  created_at, status, json_config
) VALUES (
  'DEMO_FORMATION_DIAGPV',
  'Installation Démo DiagPV',
  'Formation DiagPV',
  'Site Formation - Toiture Sud',
  4,
  6,
  24,
  datetime('now'),
  'created',
  '{"mode":"simple","stringCount":4,"modulesPerString":6}'
);

-- Modules avec positions physiques et résultats représentatifs
-- String 1 (Row 1): Majorité OK + 1 microfissure
INSERT OR IGNORE INTO modules (audit_token, module_id, string_number, position_in_string, physical_row, physical_col, status, comment, created_at) VALUES
('DEMO_FORMATION_DIAGPV', 'S1-1', 1, 1, 1, 0, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S1-2', 1, 2, 1, 1, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S1-3', 1, 3, 1, 2, 'microcracks', 'Microfissures visibles EL', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S1-4', 1, 4, 1, 3, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S1-5', 1, 5, 1, 4, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S1-6', 1, 6, 1, 5, 'ok', 'Conforme', datetime('now')),

-- String 2 (Row 2): Majorité OK + 1 inégalité  
('DEMO_FORMATION_DIAGPV', 'S2-1', 2, 1, 2, 0, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S2-2', 2, 2, 2, 1, 'inequality', 'Inégalité de luminescence', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S2-3', 2, 3, 2, 2, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S2-4', 2, 4, 2, 3, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S2-5', 2, 5, 2, 4, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S2-6', 2, 6, 2, 5, 'ok', 'Conforme', datetime('now')),

-- String 3 (Row 3): Majorité OK + 1 microfissure + 1 module HS
('DEMO_FORMATION_DIAGPV', 'S3-1', 3, 1, 3, 0, 'microcracks', 'Microfissures visibles EL', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S3-2', 3, 2, 3, 1, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S3-3', 3, 3, 3, 2, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S3-4', 3, 4, 3, 3, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S3-5', 3, 5, 3, 4, 'dead', 'Module hors service - pas de luminescence', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S3-6', 3, 6, 3, 5, 'ok', 'Conforme', datetime('now')),

-- String 4 (Row 4): Majorité OK + 1 microfissure
('DEMO_FORMATION_DIAGPV', 'S4-1', 4, 1, 4, 0, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S4-2', 4, 2, 4, 1, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S4-3', 4, 3, 4, 2, 'microcracks', 'Microfissures visibles EL', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S4-4', 4, 4, 4, 3, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S4-5', 4, 5, 4, 4, 'ok', 'Conforme', datetime('now')),
('DEMO_FORMATION_DIAGPV', 'S4-6', 4, 6, 4, 5, 'ok', 'Conforme', datetime('now'));

-- Données PVserv de test représentatives
INSERT OR IGNORE INTO pvserv_measurements (
  audit_token, string_number, module_number, 
  ff, rds, uf, measurement_type, iv_curve_data, created_at
) VALUES 
('DEMO_FORMATION_DIAGPV', 1, 1, 0.957, 17.20, 772, 'bright', '212 0.00 339 0.00', datetime('now')),
('DEMO_FORMATION_DIAGPV', 1, 2, 0.943, 18.45, 768, 'bright', '215 0.00 341 0.00', datetime('now')),
('DEMO_FORMATION_DIAGPV', 2, 1, 0.951, 17.89, 770, 'bright', '213 0.00 340 0.00', datetime('now')),
('DEMO_FORMATION_DIAGPV', 3, 5, 0.000, 0.00, 0, 'dark', 'MODULE_HS', datetime('now'));