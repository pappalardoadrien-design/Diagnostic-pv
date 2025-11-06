-- Insert 26 modules for String 1 (zone 14) - JALIBAT Plant
-- S1-P01 to S1-P26 (2 rows x 13 columns)

INSERT INTO pv_modules (
    zone_id, 
    module_identifier, 
    string_number, 
    position_in_string,
    pos_x_meters,
    pos_y_meters,
    module_status, 
    el_defect_type,
    latitude,
    longitude
) VALUES
-- Row 1: S1-P01 to S1-P13
(14, 'S1-P01', 1, 1, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P02', 1, 2, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P03', 1, 3, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P04', 1, 4, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P05', 1, 5, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P06', 1, 6, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P07', 1, 7, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P08', 1, 8, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P09', 1, 9, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P10', 1, 10, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P11', 1, 11, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P12', 1, 12, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P13', 1, 13, 0, 0, 'pending', 'none', NULL, NULL),
-- Row 2: S1-P14 to S1-P26
(14, 'S1-P14', 1, 14, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P15', 1, 15, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P16', 1, 16, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P17', 1, 17, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P18', 1, 18, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P19', 1, 19, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P20', 1, 20, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P21', 1, 21, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P22', 1, 22, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P23', 1, 23, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P24', 1, 24, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P25', 1, 25, 0, 0, 'pending', 'none', NULL, NULL),
(14, 'S1-P26', 1, 26, 0, 0, 'pending', 'none', NULL, NULL);
