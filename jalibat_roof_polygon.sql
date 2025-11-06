-- Create roof polygon for JALIBAT Plant (Zone 14 - String 1)
-- GPS Center: 44.4011°N, 0.4956°E
-- Approximate roof area: ~1862m² (based on 242 modules)

UPDATE pv_zones
SET 
    roof_polygon = '[[44.401250,0.495200],[44.401250,0.496000],[44.400950,0.496000],[44.400950,0.495200],[44.401250,0.495200]]',
    roof_area_sqm = 1862.83
WHERE id = 14;

-- Apply same to other zones (they share the same roof)
UPDATE pv_zones
SET 
    roof_polygon = '[[44.401250,0.495200],[44.401250,0.496000],[44.400950,0.496000],[44.400950,0.495200],[44.401250,0.495200]]',
    roof_area_sqm = 1862.83
WHERE id BETWEEN 15 AND 23;
