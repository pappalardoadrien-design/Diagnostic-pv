#!/bin/bash
tables=(
  "auth_users"
  "crm_clients" 
  "crm_contacts"
  "clients"
  "users"
  "projects"
  "interventions"
  "el_audits"
  "el_modules"
  "audit_assignments"
  "activity_logs"
  "sessions"
  "iv_measurements"
  "thermal_measurements"
  "isolation_tests"
  "visual_inspections"
  "post_incident_expertise"
  "pvserv_measurements"
  "el_collaborative_sessions"
)

echo "| Table | Count |"
echo "|-------|-------|"

for table in "${tables[@]}"; do
  count=$(npx wrangler d1 execute diagnostic-hub-production --local --command="SELECT COUNT(*) as c FROM $table" 2>/dev/null | grep -oP '"c":\s*\K\d+' | head -1)
  echo "| $table | ${count:-0} |"
done
