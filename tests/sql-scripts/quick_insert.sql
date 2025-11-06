-- Quick insert remaining zones (17-23) with 24 modules each
-- Zone 17 (String 4) - continue from P09
INSERT INTO pv_modules (zone_id, module_identifier, string_number, position_in_string, pos_x_meters, pos_y_meters, module_status, el_defect_type) VALUES
(17, 'S4-P09', 4, 9, 0, 0, 'ok', 'none'),
(17, 'S4-P10', 4, 10, 0, 0, 'ok', 'none'),
(17, 'S4-P11', 4, 11, 0, 0, 'ok', 'none'),
(17, 'S4-P12', 4, 12, 0, 0, 'ok', 'none'),
(17, 'S4-P13', 4, 13, 0, 0, 'ok', 'none'),
(17, 'S4-P14', 4, 14, 0, 0, 'ok', 'none'),
(17, 'S4-P15', 4, 15, 0, 0, 'ok', 'none'),
(17, 'S4-P16', 4, 16, 0, 0, 'ok', 'none'),
(17, 'S4-P17', 4, 17, 0, 0, 'ok', 'none'),
(17, 'S4-P18', 4, 18, 0, 0, 'ok', 'none'),
(17, 'S4-P19', 4, 19, 0, 0, 'ok', 'none'),
(17, 'S4-P20', 4, 20, 0, 0, 'ok', 'none'),
(17, 'S4-P21', 4, 21, 0, 0, 'ok', 'none'),
(17, 'S4-P22', 4, 22, 0, 0, 'ok', 'none'),
(17, 'S4-P23', 4, 23, 0, 0, 'ok', 'none'),
(17, 'S4-P24', 4, 24, 0, 0, 'ok', 'none');

-- Zone 18-23 (Strings 5-10) - 24 modules each, all OK
INSERT INTO pv_modules (zone_id, module_identifier, string_number, position_in_string, pos_x_meters, pos_y_meters, module_status, el_defect_type)
SELECT 18 + (n/24), 'S' || (5 + n/24) || '-P' || printf('%02d', (n%24)+1), 5 + (n/24), (n%24)+1, 0, 0, 'ok', 'none'
FROM (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23)
CROSS JOIN (SELECT 0 zone_offset UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5)
LIMIT 144;
