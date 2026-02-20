-- ============================================================================
-- SCRIPT CORRECTION: Fusionner 10 zones "String X" en 1 zone unique JALIBAT
-- ============================================================================
-- Problème: L'import audit EL → PV Carto a créé 1 zone par string
-- Solution: Fusionner en 1 zone unique avec config électrique 10 strings
-- Date: 2025-11-06
-- Centrale: JALIBAT (10 strings × 24 modules = 240 modules)

BEGIN TRANSACTION;

-- ============================================================================
-- ÉTAPE 1: Identifier la centrale JALIBAT et ses zones
-- ============================================================================
-- Trouver plant_id de JALIBAT
SELECT 
    id as plant_id,
    plant_name,
    module_count
FROM pv_plants 
WHERE plant_name LIKE '%JALIBAT%' OR plant_name LIKE '%String%'
ORDER BY id DESC
LIMIT 1;

-- Lister les zones actuelles (devrait montrer 10 zones "String 1" à "String 10")
SELECT 
    z.id as zone_id,
    z.plant_id,
    z.zone_name,
    z.string_count,
    z.modules_per_string,
    COUNT(pm.id) as module_count
FROM pv_zones z
LEFT JOIN pv_modules pm ON z.id = pm.zone_id
WHERE z.plant_id = (SELECT id FROM pv_plants WHERE plant_name LIKE '%JALIBAT%' ORDER BY id DESC LIMIT 1)
GROUP BY z.id
ORDER BY z.zone_order;

-- ============================================================================
-- ÉTAPE 2: Créer nouvelle zone unique "JALIBAT - Zone Principale"
-- ============================================================================
INSERT INTO pv_zones (
    plant_id,
    zone_name,
    zone_type,
    zone_order,
    azimuth,
    tilt,
    string_count,
    modules_per_string,
    inverter_count,
    junction_box_count,
    notes,
    created_at,
    updated_at
)
SELECT 
    plant_id,
    'JALIBAT - Zone Principale' as zone_name,
    'roof' as zone_type,
    1 as zone_order,
    180 as azimuth,  -- Sud par défaut
    30 as tilt,      -- 30° par défaut
    10 as string_count,  -- 10 strings
    24 as modules_per_string,  -- 24 modules/string
    2 as inverter_count,  -- Estimation: 2 onduleurs pour 240 modules
    0 as junction_box_count,
    'Zone fusionnée automatiquement depuis 10 zones "String X"' as notes,
    datetime('now') as created_at,
    datetime('now') as updated_at
FROM pv_zones
WHERE plant_id = (SELECT id FROM pv_plants WHERE plant_name LIKE '%JALIBAT%' ORDER BY id DESC LIMIT 1)
  AND zone_name LIKE 'String%'
LIMIT 1;

-- Récupérer l'ID de la nouvelle zone
-- (sera utilisé dans ÉTAPE 3)

-- ============================================================================
-- ÉTAPE 3: Déplacer TOUS les modules vers la zone unique
-- ============================================================================
UPDATE pv_modules
SET zone_id = (
    SELECT id 
    FROM pv_zones 
    WHERE plant_id = (SELECT id FROM pv_plants WHERE plant_name LIKE '%JALIBAT%' ORDER BY id DESC LIMIT 1)
      AND zone_name = 'JALIBAT - Zone Principale'
    LIMIT 1
),
    updated_at = datetime('now')
WHERE zone_id IN (
    SELECT id 
    FROM pv_zones 
    WHERE plant_id = (SELECT id FROM pv_plants WHERE plant_name LIKE '%JALIBAT%' ORDER BY id DESC LIMIT 1)
      AND zone_name LIKE 'String%'
);

-- ============================================================================
-- ÉTAPE 4: Supprimer les anciennes zones "String X"
-- ============================================================================
DELETE FROM pv_zones
WHERE plant_id = (SELECT id FROM pv_plants WHERE plant_name LIKE '%JALIBAT%' ORDER BY id DESC LIMIT 1)
  AND zone_name LIKE 'String%';

-- ============================================================================
-- ÉTAPE 5: Vérification finale
-- ============================================================================
-- Compter zones restantes (devrait être 1)
SELECT 
    'Zones restantes' as type,
    COUNT(*) as count
FROM pv_zones
WHERE plant_id = (SELECT id FROM pv_plants WHERE plant_name LIKE '%JALIBAT%' ORDER BY id DESC LIMIT 1);

-- Compter modules dans zone unique (devrait être 240)
SELECT 
    z.zone_name,
    z.string_count,
    z.modules_per_string,
    COUNT(pm.id) as actual_modules,
    COUNT(DISTINCT pm.string_number) as actual_strings
FROM pv_zones z
LEFT JOIN pv_modules pm ON z.id = pm.zone_id
WHERE z.plant_id = (SELECT id FROM pv_plants WHERE plant_name LIKE '%JALIBAT%' ORDER BY id DESC LIMIT 1)
GROUP BY z.id;

-- Vérifier distribution des modules par string
SELECT 
    string_number,
    COUNT(*) as modules_count
FROM pv_modules
WHERE zone_id = (
    SELECT id 
    FROM pv_zones 
    WHERE plant_id = (SELECT id FROM pv_plants WHERE plant_name LIKE '%JALIBAT%' ORDER BY id DESC LIMIT 1)
      AND zone_name = 'JALIBAT - Zone Principale'
    LIMIT 1
)
GROUP BY string_number
ORDER BY string_number;

COMMIT;

-- ============================================================================
-- NOTES D'EXÉCUTION
-- ============================================================================
-- 1. Ce script utilise wrangler D1 pour exécution locale ou production
-- 2. Pour exécuter en LOCAL:
--    wrangler d1 execute diagnostic-hub-production --local --file=FIX_MERGE_ZONES_JALIBAT.sql
--
-- 3. Pour exécuter en PRODUCTION (après test local):
--    wrangler d1 execute diagnostic-hub-production --file=FIX_MERGE_ZONES_JALIBAT.sql
--
-- 4. Vérification post-migration:
--    - 1 seule zone "JALIBAT - Zone Principale"
--    - 240 modules (10 strings × 24 modules)
--    - string_count = 10
--    - modules_per_string = 24
--
-- 5. Si erreur, ROLLBACK automatique (transaction)

-- ============================================================================
-- SÉCURITÉ
-- ============================================================================
-- ✅ Transaction ACID: tout ou rien
-- ✅ Sélection ciblée: uniquement centrale JALIBAT
-- ✅ Pas de suppression modules: déplacement uniquement
-- ✅ Backup automatique: commit history D1
-- ✅ Vérifications finales incluses
