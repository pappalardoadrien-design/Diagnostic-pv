-- Create roof polygon with correct scale for 242 modules (103.7m wide)
-- Center: 44.4011°N, 0.4956°E
-- Dimensions: 115m × 10m (with 10% margin)

-- Calculate GPS coordinates for 115m × 10m rectangle
-- At 44.4° latitude:
--   1° longitude ≈ 78,200m → 115m = 0.00147°
--   1° latitude ≈ 110,574m → 10m = 0.00009°

UPDATE pv_zones
SET 
    roof_polygon = '[[44.401550,0.494825],[44.401550,0.496375],[44.401460,0.496375],[44.401460,0.494825],[44.001550,0.494825]]',
    roof_area_sqm = 1150
WHERE id BETWEEN 14 AND 23;
