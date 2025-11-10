-- ============================================================================
-- FIX PRODUCTION: Fusionner zones JALIBAT (String 1-10 → Zone unique)
-- ============================================================================
-- Contexte: Production a 11 zones (1 vide + 10 avec modules)
-- Objectif: Migrer tous les modules vers zone unique JALIBAT (id=4)
-- ============================================================================

-- ÉTAPE 1: Vérifier structure AVANT migration
SELECT 
    '=== AVANT MIGRATION ===' as phase,
    z.id as zone_id,
    z.zone_name,
    COUNT(m.id) as module_count
FROM pv_zones z
LEFT JOIN pv_modules m ON z.id = m.zone_id
WHERE z.plant_id = 4
GROUP BY z.id
ORDER BY z.id;

-- ÉTAPE 2: Migrer tous les modules vers zone JALIBAT (id=4)
UPDATE pv_modules
SET zone_id = 4,
    updated_at = datetime('now')
WHERE zone_id IN (5, 6, 7, 8, 9, 10, 11, 12, 13, 14);

-- ÉTAPE 3: Supprimer zones orphelines String 1-10
DELETE FROM pv_zones
WHERE id IN (5, 6, 7, 8, 9, 10, 11, 12, 13, 14);

-- ÉTAPE 4: Vérifier structure APRÈS migration
SELECT 
    '=== APRÈS MIGRATION ===' as phase,
    z.id as zone_id,
    z.zone_name,
    COUNT(m.id) as module_count,
    COUNT(DISTINCT m.string_number) as string_count
FROM pv_zones z
LEFT JOIN pv_modules m ON z.id = m.zone_id
WHERE z.plant_id = 4
GROUP BY z.id
ORDER BY z.id;

-- ÉTAPE 5: Vérifier distribution par string
SELECT 
    '=== DISTRIBUTION STRINGS ===' as phase,
    string_number,
    COUNT(*) as module_count
FROM pv_modules
WHERE zone_id = 4
GROUP BY string_number
ORDER BY string_number;
