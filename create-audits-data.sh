#!/bin/bash
echo "🎯 Création audits EL liés aux interventions..."

# Audit 1: Parc Toulouse - Client Total - Lié intervention #2
curl -s -X POST http://localhost:3000/api/el/audit/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Parc Solaire Toulouse",
    "clientName": "Total Energies",
    "location": "ZI Nord, 31000 Toulouse",
    "date": "2025-11-20",
    "stringCount": 120,
    "modulesPerString": 25,
    "totalModules": 3000,
    "notes": "Audit EL lié à intervention plannifiée - Jean Martin"
  }' > /dev/null

# Audit 2: Centrale Bordeaux - Client EDF - Lié intervention #3  
curl -s -X POST http://localhost:3000/api/el/audit/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Centrale Bordeaux",
    "clientName": "EDF Renouvelables", 
    "location": "Quai Bacalan, 33000 Bordeaux",
    "date": "2025-11-21",
    "stringCount": 80,
    "modulesPerString": 25,
    "totalModules": 2000,
    "notes": "Audit EL lié à intervention tests I-V - Sophie Dubois"
  }' > /dev/null

# Audit 3: Installation Marseille - Client Engie - EN COURS
curl -s -X POST http://localhost:3000/api/el/audit/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Installation Marseille",
    "clientName": "Engie Green",
    "location": "Port Joliette, 13002 Marseille",
    "date": "2025-11-17",
    "stringCount": 50,
    "modulesPerString": 25,
    "totalModules": 1250,
    "notes": "Audit EL EN COURS - Thermographie drone - Marc Lefebvre"
  }' > /dev/null

echo "✅ 3 AUDITS EL CRÉÉS et liés aux interventions!"
echo ""
echo "📊 ARCHITECTURE COMPLÈTE:"
echo "  Clients (Total, EDF, Engie)"
echo "    └─> Projets (Toulouse, Bordeaux, Marseille, Lyon, Nantes)"
echo "        └─> Interventions (11 planifiées)"
echo "            └─> Audits EL (3 créés avec liens)"
echo ""
echo "🌐 Tester Dashboard: http://localhost:3000/dashboard"
echo "🌐 Tester Planning: http://localhost:3000/planning"
