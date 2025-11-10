-- ============================================================================
-- SEED TEST AUDITS - Pour développement et démonstration
-- ============================================================================
-- Exécuter avec: npx wrangler d1 execute diagnostic-hub-production --local --file=./seed-test-audits.sql
-- ============================================================================

-- Supprimer audits de test existants (optionnel)
DELETE FROM el_audits WHERE audit_token LIKE '%-TEST' OR audit_token LIKE '%-2024-%';

-- ============================================================================
-- AUDIT 1: Jalibat (Configuration classique 242 modules)
-- ============================================================================
INSERT INTO el_audits (
  audit_token, 
  project_name, 
  client_name, 
  location,
  string_count, 
  modules_per_string, 
  total_modules,
  status,
  completion_rate,
  created_at
) VALUES (
  'JALIBAT-2024-TEST',
  'Centrale Solaire Jalibat',
  'Jalibat Solar',
  'Jalibat, France',
  11,
  22,
  242,
  'completed',
  100.0,
  datetime('now', '-10 days')
);

-- ============================================================================
-- AUDIT 2: Grande ferme solaire (500 modules)
-- ============================================================================
INSERT INTO el_audits (
  audit_token, 
  project_name, 
  client_name, 
  location,
  string_count, 
  modules_per_string, 
  total_modules,
  status,
  completion_rate,
  created_at
) VALUES (
  'SOLAR-FARM-2024-A',
  'Ferme Solaire Provence',
  'EDF Renouvelables',
  'Provence, France',
  20,
  25,
  500,
  'in_progress',
  75.5,
  datetime('now', '-3 days')
);

-- ============================================================================
-- AUDIT 3: Toiture industrielle (144 modules)
-- ============================================================================
INSERT INTO el_audits (
  audit_token, 
  project_name, 
  client_name, 
  location,
  string_count, 
  modules_per_string, 
  total_modules,
  status,
  completion_rate,
  created_at
) VALUES (
  'ROOFTOP-2024-B',
  'Toiture Industrielle Lyon',
  'Engie Green',
  'Lyon, France',
  8,
  18,
  144,
  'completed',
  100.0,
  datetime('now', '-1 week')
);

-- ============================================================================
-- AUDIT 4: Ombrières parking (300 modules)
-- ============================================================================
INSERT INTO el_audits (
  audit_token, 
  project_name, 
  client_name, 
  location,
  string_count, 
  modules_per_string, 
  total_modules,
  status,
  completion_rate,
  created_at
) VALUES (
  'PARKING-2024-C',
  'Ombrières Parking Marseille',
  'TotalEnergies',
  'Marseille, France',
  15,
  20,
  300,
  'created',
  25.0,
  datetime('now', '-2 hours')
);

-- ============================================================================
-- AUDIT 5: Petite installation résidentielle (24 modules)
-- ============================================================================
INSERT INTO el_audits (
  audit_token, 
  project_name, 
  client_name, 
  location,
  string_count, 
  modules_per_string, 
  total_modules,
  status,
  completion_rate,
  created_at
) VALUES (
  'RESIDENTIAL-2024-D',
  'Installation Résidentielle Nice',
  'Particulier M. Dupont',
  'Nice, France',
  2,
  12,
  24,
  'completed',
  100.0,
  datetime('now', '-5 days')
);

-- ============================================================================
-- AUDIT 6: Installation moyenne (180 modules)
-- ============================================================================
INSERT INTO el_audits (
  audit_token, 
  project_name, 
  client_name, 
  location,
  string_count, 
  modules_per_string, 
  total_modules,
  status,
  completion_rate,
  created_at
) VALUES (
  'COMMERCIAL-2024-E',
  'Centre Commercial Toulouse',
  'Bouygues Énergies',
  'Toulouse, France',
  12,
  15,
  180,
  'in_progress',
  60.0,
  datetime('now', '-1 day')
);

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
SELECT 
  audit_token,
  project_name,
  client_name,
  total_modules,
  string_count || 'x' || modules_per_string as configuration,
  status,
  completion_rate || '%' as progress
FROM el_audits
ORDER BY created_at DESC;
