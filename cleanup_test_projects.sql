-- Script de nettoyage des projets de test
-- Conserve uniquement le projet JALIBAT (ID=8)

-- Désactiver les foreign keys temporairement
PRAGMA foreign_keys = OFF;

-- Supprimer toutes les données liées aux projets de test
-- En ordre inverse de dépendances

-- 1. Reports (dépend de interventions)
DELETE FROM reports WHERE intervention_id IN (1,2,3,5,6);

-- 2. Post incident expertise (dépend de interventions)
DELETE FROM post_incident_expertise WHERE intervention_id IN (1,2,3,5,6);

-- 3. Visual inspections (dépend de interventions + modules)
DELETE FROM visual_inspections WHERE intervention_id IN (1,2,3,5,6);

-- 4. Isolation tests (dépend de interventions)
DELETE FROM isolation_tests WHERE intervention_id IN (1,2,3,5,6);

-- 5. IV measurements (dépend de interventions)
DELETE FROM iv_measurements WHERE intervention_id IN (1,2,3,5,6);

-- 6. Thermal measurements (dépend de interventions + modules)
DELETE FROM thermal_measurements WHERE intervention_id IN (1,2,3,5,6);

-- 7. EL measurements (dépend de interventions + modules)
DELETE FROM el_measurements WHERE intervention_id IN (1,2,3,5,6);

-- 8. Modules (dépend de projects)
DELETE FROM modules WHERE project_id IN (1,2,3,4,5,6,7,9,10);

-- 9. Interventions (dépend de projects)
DELETE FROM interventions WHERE id IN (1,2,3,5,6);

-- 10. Projects
DELETE FROM projects WHERE id IN (1,2,3,4,5,6,7,9,10);

-- Réactiver les foreign keys
PRAGMA foreign_keys = ON;

-- Vérifier le résultat
SELECT id, name, site_address FROM projects ORDER BY id;
