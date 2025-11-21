-- Delete existing data first
DELETE FROM iv_measurements WHERE audit_token = 'f7c663dc-02e2-48ef-8045-5cc35878036f';
DELETE FROM pvserv_measurements WHERE audit_token = 'f7c663dc-02e2-48ef-8045-5cc35878036f';
DELETE FROM isolation_tests WHERE audit_token = 'f7c663dc-02e2-48ef-8045-5cc35878036f';

-- Insert IV measurements (reference curves)
INSERT INTO iv_measurements (
  intervention_id, audit_token, module_identifier, string_number, module_number, measurement_type,
  voc, isc, pmax, fill_factor, iv_curve_data
) VALUES
  (1, 'f7c663dc-02e2-48ef-8045-5cc35878036f', 'S1-1', 1, 1, 'reference', 
   38.5, 9.2, 320.5, 0.90, '[{"voltage":0,"current":9.2},{"voltage":10,"current":9.1},{"voltage":20,"current":8.8},{"voltage":30,"current":7.5},{"voltage":35,"current":5.2},{"voltage":38,"current":1.5},{"voltage":38.5,"current":0}]'),
  (1, 'f7c663dc-02e2-48ef-8045-5cc35878036f', 'S1-2', 1, 2, 'reference', 
   38.6, 9.3, 325.2, 0.91, '[{"voltage":0,"current":9.3},{"voltage":10,"current":9.2},{"voltage":20,"current":9.0},{"voltage":30,"current":7.8},{"voltage":35,"current":5.5},{"voltage":38,"current":1.8},{"voltage":38.6,"current":0}]'),
  (1, 'f7c663dc-02e2-48ef-8045-5cc35878036f', 'S1-3', 1, 3, 'reference', 
   38.7, 9.35, 328.0, 0.91, '[{"voltage":0,"current":9.35},{"voltage":10,"current":9.3},{"voltage":20,"current":9.1},{"voltage":30,"current":8.0},{"voltage":35,"current":5.8},{"voltage":38,"current":2.0},{"voltage":38.7,"current":0}]'),
  (1, 'f7c663dc-02e2-48ef-8045-5cc35878036f', 'S1-4', 1, 4, 'reference', 
   37.2, 8.9, 290.0, 0.85, '[{"voltage":0,"current":8.9},{"voltage":10,"current":8.8},{"voltage":20,"current":8.5},{"voltage":30,"current":6.5},{"voltage":35,"current":3.5},{"voltage":37,"current":0.5},{"voltage":37.2,"current":0}]');

-- Insert PVserv measurements (dark curves + diodes)
INSERT INTO pvserv_measurements (
  intervention_id, audit_token, module_identifier, string_number, module_number,
  ff, rds, uf, measurement_type, iv_curve_data
) VALUES
  (1, 'f7c663dc-02e2-48ef-8045-5cc35878036f', 'S1-1', 1, 1, 0.88, 4.2, 650, 'dark',
   '[{"voltage":0,"current":0.5},{"voltage":10,"current":0.48},{"voltage":20,"current":0.45},{"voltage":30,"current":0.35},{"voltage":35,"current":0.15},{"voltage":38,"current":0.02},{"voltage":38.5,"current":0}]'),
  (1, 'f7c663dc-02e2-48ef-8045-5cc35878036f', 'S1-2', 1, 2, 0.90, 3.8, 680, 'dark',
   '[{"voltage":0,"current":0.52},{"voltage":10,"current":0.50},{"voltage":20,"current":0.48},{"voltage":30,"current":0.38},{"voltage":35,"current":0.18},{"voltage":38,"current":0.03},{"voltage":38.6,"current":0}]'),
  (1, 'f7c663dc-02e2-48ef-8045-5cc35878036f', 'S1-3', 1, 3, 0.91, 3.5, 700, 'dark',
   '[{"voltage":0,"current":0.55},{"voltage":10,"current":0.53},{"voltage":20,"current":0.50},{"voltage":30,"current":0.40},{"voltage":35,"current":0.20},{"voltage":38,"current":0.04},{"voltage":38.7,"current":0}]'),
  (1, 'f7c663dc-02e2-48ef-8045-5cc35878036f', 'S1-4', 1, 4, 0.82, 6.8, 420, 'dark',
   '[{"voltage":0,"current":0.45},{"voltage":10,"current":0.42},{"voltage":20,"current":0.38},{"voltage":30,"current":0.25},{"voltage":35,"current":0.08},{"voltage":37,"current":0.01},{"voltage":37.2,"current":0}]');

-- Insert isolation tests
INSERT INTO isolation_tests (
  audit_token, string_number, module_number,
  test_result, resistance_value
) VALUES
  ('f7c663dc-02e2-48ef-8045-5cc35878036f', 1, 1, 'pass', 850.5),
  ('f7c663dc-02e2-48ef-8045-5cc35878036f', 1, 2, 'pass', 920.3),
  ('f7c663dc-02e2-48ef-8045-5cc35878036f', 1, 3, 'pass', 890.7),
  ('f7c663dc-02e2-48ef-8045-5cc35878036f', 1, 4, 'fail', 145.2);

SELECT 'Test data created successfully!' as message,
       (SELECT COUNT(*) FROM iv_measurements WHERE audit_token = 'f7c663dc-02e2-48ef-8045-5cc35878036f') as iv_count,
       (SELECT COUNT(*) FROM pvserv_measurements WHERE audit_token = 'f7c663dc-02e2-48ef-8045-5cc35878036f') as pvserv_count,
       (SELECT COUNT(*) FROM isolation_tests WHERE audit_token = 'f7c663dc-02e2-48ef-8045-5cc35878036f') as iso_count;
