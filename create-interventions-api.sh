#!/bin/bash

echo "🗓️  CRÉATION INTERVENTIONS VIA API REST"
echo "═══════════════════════════════════════════════════════════════"

# Intervention 1: Parc Toulouse - EL Audit non assigné
echo "1. Parc Toulouse - EL Audit (non assigné)..."
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "technician_id": null,
    "intervention_type": "el_audit",
    "intervention_date": "2025-11-20",
    "duration_hours": 8.0,
    "status": "scheduled",
    "notes": "Audit EL nocturne prévu - Non assigné"
  }' | python3 -m json.tool | head -10

# Intervention 2: Parc Toulouse - Maintenance completée (Jean Martin ID=3)
echo ""
echo "2. Parc Toulouse - Maintenance (Jean Martin)..."
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "technician_id": 3,
    "intervention_type": "maintenance",
    "intervention_date": "2025-11-10",
    "duration_hours": 4.0,
    "status": "completed",
    "notes": "Maintenance préventive - Jean Martin"
  }' | python3 -m json.tool | head -10

# Intervention 3: Extension Lyon - Inspection visuelle non assignée
echo ""
echo "3. Extension Lyon - Inspection visuelle (non assigné)..."
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 2,
    "technician_id": null,
    "intervention_type": "visual_inspection",
    "intervention_date": "2025-11-22",
    "duration_hours": 3.0,
    "status": "scheduled",
    "notes": "Inspection visuelle - Non assigné"
  }' | python3 -m json.tool | head -10

# Intervention 4: Extension Lyon - Post-incident (Marc Lefebvre ID=5)
echo ""
echo "4. Extension Lyon - Post-incident (Marc Lefebvre)..."
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 2,
    "technician_id": 5,
    "intervention_type": "post_incident",
    "intervention_date": "2025-11-28",
    "duration_hours": 6.0,
    "status": "scheduled",
    "notes": "Expertise post-orage - Marc Lefebvre"
  }' | python3 -m json.tool | head -10

# Intervention 5: Centrale Bordeaux - IV Test en cours (Sophie Dubois ID=4)
echo ""
echo "5. Centrale Bordeaux - IV Test (Sophie Dubois)..."
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 3,
    "technician_id": 4,
    "intervention_type": "iv_test",
    "intervention_date": "2025-11-21",
    "duration_hours": 5.0,
    "status": "in_progress",
    "notes": "Tests courbes IV - Sophie Dubois"
  }' | python3 -m json.tool | head -10

# Intervention 6: Centrale Bordeaux - EL Audit non assigné
echo ""
echo "6. Centrale Bordeaux - EL Audit (non assigné)..."
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 3,
    "technician_id": null,
    "intervention_type": "el_audit",
    "intervention_date": "2025-11-15",
    "duration_hours": 8.0,
    "status": "scheduled",
    "notes": "Audit EL de suivi - Non assigné"
  }' | python3 -m json.tool | head -10

# Intervention 7: Parc Nantes - Commissioning (Jean Martin ID=3)
echo ""
echo "7. Parc Nantes - Commissioning (Jean Martin)..."
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 4,
    "technician_id": 3,
    "intervention_type": "commissioning",
    "intervention_date": "2025-11-25",
    "duration_hours": 10.0,
    "status": "scheduled",
    "notes": "Commissioning indépendant - Jean Martin"
  }' | python3 -m json.tool | head -10

# Intervention 8: Parc Nantes - Isolation test non assigné
echo ""
echo "8. Parc Nantes - Isolation test (non assigné)..."
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 4,
    "technician_id": null,
    "intervention_type": "isolation_test",
    "intervention_date": "2025-11-23",
    "duration_hours": 2.0,
    "status": "scheduled",
    "notes": "Tests isolement - Non assigné"
  }' | python3 -m json.tool | head -10

# Intervention 9: Installation Marseille - Thermographie en cours (Sophie Dubois ID=4)
echo ""
echo "9. Installation Marseille - Thermographie (Sophie Dubois)..."
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 5,
    "technician_id": 4,
    "intervention_type": "thermography",
    "intervention_date": "2025-11-17",
    "duration_hours": 6.0,
    "status": "in_progress",
    "notes": "Thermographie drone - Sophie Dubois"
  }' | python3 -m json.tool | head -10

# Intervention 10: Installation Marseille - EL Audit non assigné
echo ""
echo "10. Installation Marseille - EL Audit (non assigné)..."
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 5,
    "technician_id": null,
    "intervention_type": "el_audit",
    "intervention_date": "2025-11-21",
    "duration_hours": 8.0,
    "status": "scheduled",
    "notes": "Audit EL complet - Non assigné"
  }' | python3 -m json.tool | head -10

# Intervention 11: Parc Toulouse - Maintenance annulée
echo ""
echo "11. Parc Toulouse - Maintenance (annulée)..."
curl -s -X POST http://localhost:3000/api/planning/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "technician_id": null,
    "intervention_type": "maintenance",
    "intervention_date": "2025-11-05",
    "duration_hours": 4.0,
    "status": "cancelled",
    "notes": "Annulée - Conditions météo"
  }' | python3 -m json.tool | head -10

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ 11 INTERVENTIONS CRÉÉES VIA API REST"
echo "═══════════════════════════════════════════════════════════════"
