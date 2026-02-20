-- ============================================================================
-- Import GIRASOLE 52 Centrales (TEST DATA)
-- Date: 2025-11-20
-- Données de test pour développement module GIRASOLE
-- ============================================================================

-- 1. Créer client GIRASOLE Energies
INSERT OR IGNORE INTO clients (
  id, name, contact_email, contact_phone, address, notes, created_at
) VALUES (
  1,
  'GIRASOLE Energies',
  'contact@girasole-energies.fr',
  '+33 4 XX XX XX XX',
  'Montpellier, France',
  'Mission Janvier-Mars 2025 - 52 centrales PV - Budget 66.885€ HT',
  datetime('now')
);

-- 2. Créer 39 centrales SOL (CONFORMITE uniquement)
INSERT INTO projects (client_id, name, site_address, is_girasole, id_referent, audit_types, installation_power, created_at, updated_at) VALUES
(1, 'Centrale SOL 01 - Antunez SCI ANAUJA', 'Montpellier, 34000', 1, '31971', '["CONFORMITE"]', 250.5, datetime('now'), datetime('now')),
(1, 'Centrale SOL 02 - Azemar', 'Béziers, 34500', 1, '31972', '["CONFORMITE"]', 180.3, datetime('now'), datetime('now')),
(1, 'Centrale SOL 03 - Bernat', 'Narbonne, 11100', 1, '31973', '["CONFORMITE"]', 320.7, datetime('now'), datetime('now')),
(1, 'Centrale SOL 04 - Bonnafous', 'Carcassonne, 11000', 1, '31974', '["CONFORMITE"]', 195.2, datetime('now'), datetime('now')),
(1, 'Centrale SOL 05 - Borel', 'Perpignan, 66000', 1, '31975', '["CONFORMITE"]', 275.8, datetime('now'), datetime('now')),
(1, 'Centrale SOL 06 - Bouix', 'Nîmes, 30000', 1, '31976', '["CONFORMITE"]', 210.4, datetime('now'), datetime('now')),
(1, 'Centrale SOL 07 - Bousquet', 'Alès, 30100', 1, '31977', '["CONFORMITE"]', 165.9, datetime('now'), datetime('now')),
(1, 'Centrale SOL 08 - Broussous', 'Avignon, 84000', 1, '31978', '["CONFORMITE"]', 290.6, datetime('now'), datetime('now')),
(1, 'Centrale SOL 09 - Cabrol', 'Orange, 84100', 1, '31979', '["CONFORMITE"]', 245.3, datetime('now'), datetime('now')),
(1, 'Centrale SOL 10 - Calvet', 'Carpentras, 84200', 1, '31980', '["CONFORMITE"]', 305.1, datetime('now'), datetime('now')),
(1, 'Centrale SOL 11 - Carceller', 'Arles, 13200', 1, '31981', '["CONFORMITE"]', 220.7, datetime('now'), datetime('now')),
(1, 'Centrale SOL 12 - Castan', 'Salon-de-Provence, 13300', 1, '31982', '["CONFORMITE"]', 185.4, datetime('now'), datetime('now')),
(1, 'Centrale SOL 13 - Chabert', 'Aix-en-Provence, 13100', 1, '31983', '["CONFORMITE"]', 270.9, datetime('now'), datetime('now')),
(1, 'Centrale SOL 14 - Coste', 'Marseille, 13000', 1, '31984', '["CONFORMITE"]', 315.2, datetime('now'), datetime('now')),
(1, 'Centrale SOL 15 - Delmas', 'Aubagne, 13400', 1, '31985', '["CONFORMITE"]', 198.6, datetime('now'), datetime('now')),
(1, 'Centrale SOL 16 - Delpuech', 'La Ciotat, 13600', 1, '31986', '["CONFORMITE"]', 255.8, datetime('now'), datetime('now')),
(1, 'Centrale SOL 17 - Dufour', 'Toulon, 83000', 1, '31987', '["CONFORMITE"]', 285.3, datetime('now'), datetime('now')),
(1, 'Centrale SOL 18 - Esteve', 'Hyères, 83400', 1, '31988', '["CONFORMITE"]', 240.1, datetime('now'), datetime('now')),
(1, 'Centrale SOL 19 - Fabre', 'Draguignan, 83300', 1, '31989', '["CONFORMITE"]', 205.7, datetime('now'), datetime('now')),
(1, 'Centrale SOL 20 - Fau', 'Fréjus, 83600', 1, '31990', '["CONFORMITE"]', 295.4, datetime('now'), datetime('now')),
(1, 'Centrale SOL 21 - Ferrer', 'Cannes, 06400', 1, '31991', '["CONFORMITE"]', 175.9, datetime('now'), datetime('now')),
(1, 'Centrale SOL 22 - Garcia', 'Grasse, 06130', 1, '31992', '["CONFORMITE"]', 265.2, datetime('now'), datetime('now')),
(1, 'Centrale SOL 23 - Gau', 'Antibes, 06600', 1, '31993', '["CONFORMITE"]', 225.8, datetime('now'), datetime('now')),
(1, 'Centrale SOL 24 - Gimenez', 'Nice, 06000', 1, '31994', '["CONFORMITE"]', 310.5, datetime('now'), datetime('now')),
(1, 'Centrale SOL 25 - Guiraud', 'Menton, 06500', 1, '31995', '["CONFORMITE"]', 190.3, datetime('now'), datetime('now')),
(1, 'Centrale SOL 26 - Julia', 'Monaco, 98000', 1, '31996', '["CONFORMITE"]', 280.6, datetime('now'), datetime('now')),
(1, 'Centrale SOL 27 - Laborie', 'Gap, 05000', 1, '31997', '["CONFORMITE"]', 260.1, datetime('now'), datetime('now')),
(1, 'Centrale SOL 28 - Laffont', 'Briançon, 05100', 1, '31998', '["CONFORMITE"]', 235.7, datetime('now'), datetime('now')),
(1, 'Centrale SOL 29 - Laporte', 'Digne-les-Bains, 04000', 1, '31999', '["CONFORMITE"]', 215.4, datetime('now'), datetime('now')),
(1, 'Centrale SOL 30 - Lloret', 'Manosque, 04100', 1, '32000', '["CONFORMITE"]', 300.9, datetime('now'), datetime('now')),
(1, 'Centrale SOL 31 - Lopez', 'Sisteron, 04200', 1, '32001', '["CONFORMITE"]', 195.6, datetime('now'), datetime('now')),
(1, 'Centrale SOL 32 - Marti', 'Barcelonnette, 04400', 1, '32002', '["CONFORMITE"]', 270.2, datetime('now'), datetime('now')),
(1, 'Centrale SOL 33 - Martinez', 'Embrun, 05200', 1, '32003', '["CONFORMITE"]', 245.8, datetime('now'), datetime('now')),
(1, 'Centrale SOL 34 - Massot', 'Grenoble, 38000', 1, '32004', '["CONFORMITE"]', 325.3, datetime('now'), datetime('now')),
(1, 'Centrale SOL 35 - Mateu', 'Chambéry, 73000', 1, '32005', '["CONFORMITE"]', 210.7, datetime('now'), datetime('now')),
(1, 'Centrale SOL 36 - Maurel', 'Annecy, 74000', 1, '32006', '["CONFORMITE"]', 290.4, datetime('now'), datetime('now')),
(1, 'Centrale SOL 37 - Maynadier', 'Lyon, 69000', 1, '32007', '["CONFORMITE"]', 305.9, datetime('now'), datetime('now')),
(1, 'Centrale SOL 38 - Negre', 'Saint-Étienne, 42000', 1, '32008', '["CONFORMITE"]', 185.2, datetime('now'), datetime('now')),
(1, 'Centrale SOL 39 - Nogues', 'Clermont-Ferrand, 63000', 1, '32009', '["CONFORMITE"]', 275.6, datetime('now'), datetime('now'));

-- 3. Créer 13 centrales DOUBLE (CONFORMITE + TOITURE)
INSERT INTO projects (client_id, name, site_address, is_girasole, id_referent, audit_types, installation_power, created_at, updated_at) VALUES
(1, 'Centrale TOITURE 01 - EARL CADOT', 'Montpellier Sud, 34000', 1, '32010', '["CONFORMITE", "TOITURE"]', 150.5, datetime('now'), datetime('now')),
(1, 'Centrale TOITURE 02 - Hangar Bernard MAGE', 'Béziers Est, 34500', 1, '32011', '["CONFORMITE", "TOITURE"]', 125.3, datetime('now'), datetime('now')),
(1, 'Centrale TOITURE 03 - Hangar DOMERGUE', 'Narbonne Nord, 11100', 1, '32012', '["CONFORMITE", "TOITURE"]', 135.7, datetime('now'), datetime('now')),
(1, 'Centrale TOITURE 04 - SCEA CADILHAC', 'Carcassonne Ouest, 11000', 1, '32013', '["CONFORMITE", "TOITURE"]', 145.2, datetime('now'), datetime('now')),
(1, 'Centrale TOITURE 05 - SCEA CANTIE 1', 'Perpignan Centre, 66000', 1, '32014', '["CONFORMITE", "TOITURE"]', 155.8, datetime('now'), datetime('now')),
(1, 'Centrale TOITURE 06 - SCEA CANTIE 2', 'Nîmes Sud, 30000', 1, '32015', '["CONFORMITE", "TOITURE"]', 140.4, datetime('now'), datetime('now')),
(1, 'Centrale TOITURE 07 - SCEA CANTIE 3', 'Alès Nord, 30100', 1, '32016', '["CONFORMITE", "TOITURE"]', 130.9, datetime('now'), datetime('now')),
(1, 'Centrale TOITURE 08 - SCEA CAP OUEST', 'Avignon Est, 84000', 1, '32017', '["CONFORMITE", "TOITURE"]', 160.6, datetime('now'), datetime('now')),
(1, 'Centrale TOITURE 09 - SCEA DU DESERT', 'Orange Sud, 84100', 1, '32018', '["CONFORMITE", "TOITURE"]', 142.3, datetime('now'), datetime('now')),
(1, 'Centrale TOITURE 10 - SCEA ESTRADE', 'Carpentras Ouest, 84200', 1, '32019', '["CONFORMITE", "TOITURE"]', 152.1, datetime('now'), datetime('now')),
(1, 'Centrale TOITURE 11 - SCEA FERME DE BIONNE', 'Arles Centre, 13200', 1, '32020', '["CONFORMITE", "TOITURE"]', 147.7, datetime('now'), datetime('now')),
(1, 'Centrale TOITURE 12 - SCEA LES 4 SAISONS', 'Salon-de-Provence Nord, 13300', 1, '32021', '["CONFORMITE", "TOITURE"]', 138.4, datetime('now'), datetime('now')),
(1, 'Centrale TOITURE 13 - SCEA MAS DE JANIN', 'Aix-en-Provence Sud, 13100', 1, '32022', '["CONFORMITE", "TOITURE"]', 165.9, datetime('now'), datetime('now'));
