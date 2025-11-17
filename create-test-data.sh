#!/bin/bash
# Script de création données de test - Module Planning

echo "🚀 Création données de test Planning..."

# Projects
echo "📊 Création 5 projets..."
npx wrangler d1 execute diagnostic-hub-production --local --command="
INSERT OR IGNORE INTO projects (client_id, name, site_address, installation_power, total_modules) VALUES 
  (1, 'Parc Toulouse', 'ZI Nord, 31000 Toulouse', 1200.0, 3000),
  (2, 'Centrale Bordeaux', 'Quai Bacalan, 33000', 800.0, 2000),
  (3, 'Installation Marseille', 'Port Joliette, 13002', 500.0, 1250),
  (1, 'Extension Lyon', 'Part-Dieu, 69003', 600.0, 1500),
  (2, 'Parc Nantes', 'Île Nantes, 44000', 1000.0, 2500);
" > /dev/null 2>&1

# Interventions via API
echo "📅 Création 10 interventions..."

# Intervention 1: Jean Martin - EL Audit - PLANIFIÉE
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{"project_id":1,"technician_id":3,"intervention_type":"el_audit","intervention_date":"2025-11-20","duration_hours":6,"status":"scheduled"}' > /dev/null

# Intervention 2: Sophie Dubois - I-V Test - PLANIFIÉE
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{"project_id":2,"technician_id":4,"intervention_type":"iv_test","intervention_date":"2025-11-21","duration_hours":8,"status":"scheduled"}' > /dev/null

# Intervention 3: Marc Lefebvre - Thermographie - EN COURS
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{"project_id":3,"technician_id":5,"intervention_type":"thermography","intervention_date":"2025-11-17","duration_hours":4,"status":"in_progress"}' > /dev/null

# Intervention 4: NON ASSIGNÉE - Inspection visuelle
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{"project_id":4,"technician_id":null,"intervention_type":"visual_inspection","intervention_date":"2025-11-22","duration_hours":5,"status":"scheduled"}' > /dev/null

# Intervention 5: NON ASSIGNÉE - Commissioning
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{"project_id":5,"technician_id":null,"intervention_type":"commissioning","intervention_date":"2025-11-25","duration_hours":10,"status":"scheduled"}' > /dev/null

# Intervention 6: Jean Martin - Maintenance - TERMINÉE
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{"project_id":1,"technician_id":3,"intervention_type":"maintenance","intervention_date":"2025-11-10","duration_hours":3,"status":"completed"}' > /dev/null

# Intervention 7: Sophie Dubois - EL Audit - CONFLIT (même date que #2)
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{"project_id":3,"technician_id":4,"intervention_type":"el_audit","intervention_date":"2025-11-21","duration_hours":10,"status":"scheduled"}' > /dev/null

# Intervention 8: Marc Lefebvre - Test isolation
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{"project_id":5,"technician_id":5,"intervention_type":"isolation_test","intervention_date":"2025-11-23","duration_hours":4,"status":"scheduled"}' > /dev/null

# Intervention 9: NON ASSIGNÉE - Post-sinistre
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{"project_id":4,"technician_id":null,"intervention_type":"post_incident","intervention_date":"2025-11-28","duration_hours":6,"status":"scheduled"}' > /dev/null

# Intervention 10: Jean Martin - EL Audit - ANNULÉE
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{"project_id":2,"technician_id":3,"intervention_type":"el_audit","intervention_date":"2025-11-15","duration_hours":4,"status":"cancelled"}' > /dev/null

echo "✅ DONNÉES DE TEST CRÉÉES!"
echo ""
echo "📋 RÉSUMÉ:"
echo "  - 3 Techniciens (Jean, Sophie, Marc)"
echo "  - 3 Clients (Total, EDF, Engie)"
echo "  - 5 Projets (Toulouse, Bordeaux, Marseille, Lyon, Nantes)"
echo "  - 10 Interventions (variées: planifiées, en cours, terminées, annulées)"
echo ""
echo "🌐 Tester sur: http://localhost:3000/planning"
