-- Insert clients into simple clients table (used by projects FK)
INSERT OR IGNORE INTO clients (name, contact_email, address) VALUES 
  ('TotalEnergies Renouvelables', 'contact@totalenergies.fr', 'Paris, France'),
  ('EDF Énergies Vertes', 'contact@edf.fr', 'Bordeaux, France'),
  ('Engie Green Power', 'contact@engie.fr', 'Marseille, France');

-- Insert projects
INSERT OR IGNORE INTO projects (client_id, name, site_address, installation_power, total_modules, string_count, modules_per_string) VALUES 
  (1, 'Parc Solaire Toulouse', 'ZI Nord, 31000 Toulouse', 1200.0, 3000, 120, 25),
  (2, 'Centrale Bordeaux', 'Quai Bacalan, 33000 Bordeaux', 800.0, 2000, 80, 25),
  (3, 'Installation Marseille', 'Port Joliette, 13002 Marseille', 500.0, 1250, 50, 25),
  (1, 'Extension Lyon', 'Part-Dieu, 69003 Lyon', 600.0, 1500, 60, 25),
  (2, 'Parc Nantes', 'Île Nantes, 44000 Nantes', 1000.0, 2500, 100, 25);

-- Insert interventions  
INSERT OR IGNORE INTO interventions (project_id, technician_id, intervention_type, intervention_date, duration_hours, status, notes) VALUES 
  (1, 3, 'el_audit', '2025-11-20', 6.0, 'scheduled', 'Audit EL nocturne - 3000 modules'),
  (2, 4, 'iv_test', '2025-11-21', 8.0, 'scheduled', 'Tests courbes I-V'),
  (3, 5, 'thermography', '2025-11-17', 4.0, 'in_progress', 'Thermographie drone'),
  (4, NULL, 'visual_inspection', '2025-11-22', 5.0, 'scheduled', 'Inspection visuelle post-tempête'),
  (5, NULL, 'commissioning', '2025-11-25', 10.0, 'scheduled', 'Commissioning complet'),
  (1, 3, 'maintenance', '2025-11-10', 3.0, 'completed', 'Maintenance préventive'),
  (3, 4, 'el_audit', '2025-11-21', 10.0, 'scheduled', 'CONFLIT: Même date que intervention 2'),
  (5, 5, 'isolation_test', '2025-11-23', 4.0, 'scheduled', 'Tests isolation NF C 15-100'),
  (4, NULL, 'post_incident', '2025-11-28', 6.0, 'scheduled', 'Expertise judiciaire suite grêle'),
  (2, 3, 'el_audit', '2025-11-15', 4.0, 'cancelled', 'Audit EL reporté');
