-- ============================================
-- 1. CRÉATION CLIENT GIRASOLE
-- ============================================

INSERT INTO crm_clients (
  company_name, siret, main_contact_email, main_contact_phone,
  address, city, postal_code, country, notes, created_at, updated_at
) VALUES (
  'GIRASOLE Energies',
  '',
  'contact@girasole-energies.fr',
  '06 74 94 09 90',
  'France',
  'National',
  '',
  'France',
  'Client GIRASOLE - Mission 52 audits conformité PV (39 SOL + 13 DOUBLE TOITURE) - Budget 66.885€ HT - Période Janvier-Mars 2025',
  datetime('now'),
  datetime('now')
);


-- ============================================
-- 2. CRÉATION 52 PROJECTS (CENTRALES)
-- ============================================

-- Centrale: Antunez - SCI ANAUJA (269.45 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Antunez - SCI ANAUJA',
  '253 Bd Robert Koch, 34500 Béziers, France',
  269.45,
  43.3654,
  3.2529,
  'Type: Ombrière simple | Installateur: LE TRIANGLE',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: EARL CADOT (309.4 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'EARL CADOT',
  'La Maisonneuve, 42310 Urbise, France',
  309.4,
  46.24919,
  3.88361,
  'Type: Bâtiment à construire - C | Installateur: 3C instal',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Azemar (319.0 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Azemar',
  '12160 Camboulazet, France',
  319.0,
  44.25786,
  2.45787,
  'Type: Bâtiment à construire - C | Installateur: 3C instal',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Mathieu Montet (256.055 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Mathieu Montet',
  '127 Route de la Tour, 38110 Montagnieu, France',
  256.055,
  45.53534,
  5.45229,
  'Type: Toiture existante / Rénovation | Installateur: PROSUNFRANCE',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Laurent ROUX (123.41 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Laurent ROUX',
  'Cros et Vareine, 15260 Neuvéglise-sur-Truyère, France',
  123.41,
  44.92766,
  2.99036,
  'Type: Toiture existante / Rénovation | Installateur: OFT ',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Bernard MAGE (300.82 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Bernard MAGE',
  'Broussoles, 46210 Montet-et-Bouxal, France',
  300.82,
  44.75755,
  2.04496,
  'Type: Bâtiment à construire -  A2 | Installateur: Acrom',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Pierre MOURGUES (222.5 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Pierre MOURGUES',
  'Mondounet - Fargues, 46800 Porte-du-Quercy, France',
  222.5,
  44.38426,
  1.16738,
  'Type: Bâtiment à construire - C | Installateur: Acrom',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Karl Biteau (324.22 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Karl Biteau',
  '17250 Sainte-Gemme, France',
  324.22,
  45.7447,
  -0.92605,
  'Type: Bâtiment à construire - C | Installateur: Eiffage',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Burgat Et Fils Tp (113.03 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Burgat Et Fils Tp',
  'La Plaine 11300 Cournanel',
  113.03,
  43.04294,
  2.23988,
  'Type: Toiture existante / Rénovation | Installateur: SOLARTIS',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: HANGAR Angelina SIMMONET (173.55 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'HANGAR Angelina SIMMONET',
  'L''Étang Fouché, 03230 Paray-le-Frésil, France',
  173.55,
  46.63388,
  3.58233,
  'Type: Bâtiment à construire - A1 | Installateur: LE TRIANGLE',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Maymat (345.8 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Maymat',
  'Les Sorreaux, 03400 Toulon-sur-Allier, France',
  345.8,
  46.51456,
  3.41436,
  'Type: Bâtiment à construire - C | Installateur: LE TRIANGLE',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: HANGAR Christian MIGNARD (97.11 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'HANGAR Christian MIGNARD',
  'Chemin de Rieux 11700 Pépieux',
  97.11,
  43.297058,
  2.665955,
  'Type: Bâtiment à construire - B | Installateur: Solartis',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: DUMONT GUY (232.2 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'DUMONT GUY',
  'Les Sabots, 03230 Chevagnes, France',
  232.2,
  46.628738,
  3.585084,
  'Type: Bâtiment à construire - A1 | Installateur: LE TRIANGLE',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: MARTEL 184 Construction (499.95 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'MARTEL 184 Construction',
  'Lieudit Les Ribières, 23240 Le Grand Bourg',
  499.95,
  46.21212,
  1.66779,
  'Type: Bâtiment à construire -  A2 | Installateur: NEOXOM',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: BOUCHARDY 203 LOC (498.68 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'BOUCHARDY 203 LOC',
  'Saint-Martin, 23320 Saint-Vaury, France',
  498.68,
  46.18866,
  1.70087,
  'Type: Toiture existante / Rénovation | Installateur: OFT',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: BOULOIR 206 LOC (499.14 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'BOULOIR 206 LOC',
  '23240 Le Grand-Bourg, France',
  499.14,
  46.21057,
  1.67252,
  'Type: Toiture existante / Rénovation | Installateur: OFT',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Renaud Sonnard (324.87 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Renaud Sonnard',
  'Les grandes versaines, 79160 Villiers-en-Plaine, France',
  324.87,
  46.41411,
  -0.53832,
  'Type: Bâtiment à construire - A1 | Installateur: REGIESOLAIRE',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Fabrice COMBY (499.59 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Fabrice COMBY',
  'Besse, 19210 Saint-Éloy-les-Tuileries, France',
  499.59,
  45.452821,
  1.2834,
  'Type: Toiture existante / PV Ready | Installateur: HBBAT',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Julien Vaudin (348.88 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Julien Vaudin',
  'Les Jacquets, 03230 Chevagnes, France',
  348.88,
  46.58741,
  3.5494,
  'Type: Toiture existante / Rénovation | Installateur: PROSUNFRANCE',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Richard VAN ZANTEN (330.785 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Richard VAN ZANTEN',
  'La Tuque, 47210 Parranquet, France',
  330.785,
  44.66239,
  0.83643,
  'Type: Bâtiment à construire -  A2 | Installateur: Acrom',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: HANGAR Benoit BERTELOOT (278.64 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'HANGAR Benoit BERTELOOT',
  '127 Lieu Dit les Cleris 89150 Vernoy',
  278.64,
  48.107174,
  3.120535,
  'Type: Bâtiment à construire - A1 | Installateur: LE TRIANGLE',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Laurent ROUX (313.95 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Laurent ROUX',
  '10 Rue de Vareine 15260 Neuvéglise-sur-Truyère',
  313.95,
  44.92782,
  2.98992,
  'Type: Bâtiment à construire -  A2 | Installateur: Yama Energies',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Serge Maltaverne (218.855 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Serge Maltaverne',
  '638 Chard, 71320 Sainte-Radegonde, France',
  218.855,
  46.6938,
  4.10361,
  'Type: Toiture existante / Rénovation | Installateur: PROSUNFRANCE',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Christophe CARRERE n°2 (278.005 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Christophe CARRERE n°2',
  'Boy, 47600 Montagnac-sur-Auvignon, France',
  278.005,
  44.14804,
  0.44966,
  'Type: Bâtiment à construire - A1 | Installateur: Acrom',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Frédéric CASTET (309.4 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Frédéric CASTET',
  '11 Carrère de la Goutille, 31160 Estadens, France',
  309.4,
  43.043825,
  0.859333,
  'Type: Bâtiment à construire - C | Installateur: KEVEL',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: MARTEL 183 LOC (456.82 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'MARTEL 183 LOC',
  'LIEU-DIT LES RIBIERES LE GRAND BOURG',
  456.82,
  46.2125953274947,
  1.66652635015915,
  'Type: Toiture existante / Rénovation | Installateur: NEOXOM',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Frederic Sinaud (499.59 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Frederic Sinaud',
  '11 La Quaire, 23240 Saint-Priest-la-Plaine, France',
  499.59,
  46.2183,
  1.65147,
  'Type: Bâtiment à construire - C | Installateur: INNOVA',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Frederic Sinaud (218.4 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Frederic Sinaud',
  'La Drable, 23300 Saint Priest la feuille',
  218.4,
  46.23163,
  1.52775,
  'Type: Bâtiment à construire - C | Installateur: INNOVA',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: HARAS DE LA MAJORIE/MANOHA (499.59 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'HARAS DE LA MAJORIE/MANOHA',
  'L''Homme, 07790 Saint-Alban-d''Ay, France',
  499.59,
  45.19709,
  4.66906,
  'Type: Bâtiment à construire - C | Installateur: KEVEL',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Yannick CLEMENT (331.24 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Yannick CLEMENT',
  'Gazailles, 31160 Estadens, France',
  331.24,
  43.04786,
  0.85301,
  'Type: Bâtiment à construire - C | Installateur: KEVEL',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Concept-TY Chambray 2 (118.37 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Concept-TY Chambray 2',
  'Rue Etienne Cosson, 37170 Chambray-lès-Tours, France',
  118.37,
  47.32796,
  0.70112,
  'Type: Toiture existante / PV Ready | Installateur: REGIESOLAIRE',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Patrick BLANCHET (159.25 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Patrick BLANCHET',
  'Les Exclis, 26110 Venterol, France',
  159.25,
  44.36059,
  5.07619,
  'Type: Bâtiment à construire - C | Installateur: KEVEL',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: MATHIEU Vincent (218.4 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'MATHIEU Vincent',
  'Lieu-dit Les Avals 11700 LA REDORTE',
  218.4,
  43.24989,
  2.64117,
  'Type: Bâtiment à construire - C | Installateur: KEVEL',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Cheraud (499.59 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Cheraud',
  'Bellevue, 44260 Malville, France',
  499.59,
  47.355,
  -1.83701,
  'Type: Bâtiment à construire -  A2 | Installateur: OFT',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Frédéric CASTET (268.65 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Frédéric CASTET',
  '11 carrère de la Gentille, ESTADENS, 31160',
  268.65,
  43.043896,
  0.859961,
  'Type: Toiture existante / Rénovation | Installateur: NEOXOM',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Didier - PRIEUR (499.59 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Didier - PRIEUR',
  'Quartier de Montalivet 26120 Montmeyran',
  499.59,
  44.84159,
  4.96118,
  'Type: Bâtiment à construire - C | Installateur: KEVEL',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Eric LOGNON (324.87 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Eric LOGNON',
  'Château des Millets, 03230 Chevagnes, France',
  324.87,
  46.60446,
  3.61907,
  'Type: Bâtiment à construire -  A2 | Installateur: PROSUNFRANCE',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar LAMIOT (343.07 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar LAMIOT',
  'La Gélopière, 42110 Feurs, France',
  343.07,
  45.73247,
  4.2053,
  'Type: Bâtiment à construire - C | Installateur: PROSUNFRANCE',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: VIEL (211.575 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'VIEL',
  'La Haute Bellangerais, 44390 Les Touches, France',
  211.575,
  47.46443,
  -1.40235,
  'Type: Bâtiment à construire - A1 | Installateur: OFT',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Serge Maltaverne (260.26 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Serge Maltaverne',
  '638  route Chard, 71320 Sainte-Radegonde, France',
  260.26,
  46.69424,
  4.10364,
  'Type: Bâtiment à construire - C | Installateur: PROSUNFRANCE',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: SCI KILJOR (109.2 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'SCI KILJOR',
  '6 Rue Albert Camus, 07800 La Voulte-sur-Rhône, France',
  109.2,
  44.81516,
  4.78922,
  'Type: Toiture existante / Rénovation | Installateur: NEOXOM',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Benjamin CHASSON (388.04 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Benjamin CHASSON',
  '465 Rue Jean Rostand, 26800 Portes-lès-Valence, France',
  388.04,
  44.89225,
  4.87492,
  'Type: Bâtiment à construire - C | Installateur: NEOXOM ',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Bourgeois (225.68 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Bourgeois',
  'Le Roscouët, 44440 Teillé, France',
  225.68,
  47.44106,
  -1.27682,
  'Type: Bâtiment à construire - A1 | Installateur: INNOVA',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: EARL GOUNY (331.24 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'EARL GOUNY',
  'Gouny, 47350 Escassefort, France',
  331.24,
  44.56123,
  0.24227,
  'Type: Bâtiment à construire - C | Installateur: HBBAT',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Maxime Bayle (324.87 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Maxime Bayle',
  'Château Lagoual, 11400 Lasbordes, France',
  324.87,
  43.30401,
  2.07536,
  'Type: Bâtiment à construire - A1 | Installateur: Yama Energies',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Commune De Pomas (254.8 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Commune De Pomas',
  'Rue de la Mairie, 11250 Pomas, France',
  254.8,
  43.11473,
  2.2963,
  'Type: Bâtiment à construire - C | Installateur: KEVEL',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: GFA LASCOMBES - ANTOINE MICOULEAU (277.095 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'GFA LASCOMBES - ANTOINE MICOULEAU',
  'Lascombes, 11170 Alzonne, France',
  277.095,
  43.26257,
  2.15214,
  'Type: Bâtiment à construire - A1 | Installateur: Yama Energies',
  '["CONFORMITE", "TOITURE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: HANGAR Gérald Guillet (197.8 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'HANGAR Gérald Guillet',
  'Bois Rond, 17510 Les Éduts, France',
  197.8,
  45.98895,
  -0.21354,
  'Type: Bâtiment à construire -  A2 | Installateur: Eiffage',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Joris SAINT MARTIN (218.4 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Joris SAINT MARTIN',
  'Palancot, 32160 Jû-Belloc, France',
  218.4,
  43.56698,
  0.0163,
  'Type: Bâtiment à construire - C | Installateur: Acrom',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: GAYET 42 (309.4 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'GAYET 42',
  '419 Chemin des Seigles, 42210 Craintilleux, France',
  309.4,
  45.57895,
  4.21851,
  'Type: Bâtiment à construire - C | Installateur: 3C instal',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: Hangar Sebastien RUDELLE (309.4 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'Hangar Sebastien RUDELLE',
  'Crayssac, 12120 Salmiech, France',
  309.4,
  44.21679,
  2.63349,
  'Type: Bâtiment à construire - C | Installateur: 3C instal',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- Centrale: TOURNIER (197.925 kWc)
INSERT INTO projects (
  client_id, name, site_address, installation_power,
  latitude, longitude, notes, audit_types, created_at, updated_at
) VALUES (
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  'TOURNIER',
  '548 Route de Marignac, 31430 Gratens, France',
  197.925,
  43.3172,
  1.12116,
  'Type: Toiture existante / Rénovation | Installateur: KEVEL',
  '["CONFORMITE"]',
  datetime('now'),
  datetime('now')
);


-- ============================================
-- 3. CRÉATION 52 AUDITS
-- ============================================

-- Audit: Antunez - SCI ANAUJA
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-31971-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Antunez - SCI ANAUJA' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Antunez - SCI ANAUJA',
  'GIRASOLE Energies',
  '253 Bd Robert Koch, 34500 Béziers, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: EARL CADOT
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-89219-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'EARL CADOT' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'EARL CADOT',
  'GIRASOLE Energies',
  'La Maisonneuve, 42310 Urbise, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Azemar
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-83705-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Azemar' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Azemar',
  'GIRASOLE Energies',
  '12160 Camboulazet, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Mathieu Montet
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-17996-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Mathieu Montet' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Mathieu Montet',
  'GIRASOLE Energies',
  '127 Route de la Tour, 38110 Montagnieu, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Laurent ROUX
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-17966-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Laurent ROUX' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Laurent ROUX',
  'GIRASOLE Energies',
  'Cros et Vareine, 15260 Neuvéglise-sur-Truyère, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Bernard MAGE
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-70087-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Bernard MAGE' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Bernard MAGE',
  'GIRASOLE Energies',
  'Broussoles, 46210 Montet-et-Bouxal, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Pierre MOURGUES
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-30489-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Pierre MOURGUES' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Pierre MOURGUES',
  'GIRASOLE Energies',
  'Mondounet - Fargues, 46800 Porte-du-Quercy, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Karl Biteau
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-58962-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Karl Biteau' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Karl Biteau',
  'GIRASOLE Energies',
  '17250 Sainte-Gemme, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Burgat Et Fils Tp
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-28173-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Burgat Et Fils Tp' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Burgat Et Fils Tp',
  'GIRASOLE Energies',
  'La Plaine 11300 Cournanel',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: HANGAR Angelina SIMMONET
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-29246-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'HANGAR Angelina SIMMONET' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'HANGAR Angelina SIMMONET',
  'GIRASOLE Energies',
  'L''Étang Fouché, 03230 Paray-le-Frésil, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Maymat
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-76547-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Maymat' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Maymat',
  'GIRASOLE Energies',
  'Les Sorreaux, 03400 Toulon-sur-Allier, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: HANGAR Christian MIGNARD
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-22147-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'HANGAR Christian MIGNARD' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'HANGAR Christian MIGNARD',
  'GIRASOLE Energies',
  'Chemin de Rieux 11700 Pépieux',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: DUMONT GUY
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-60830-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'DUMONT GUY' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'DUMONT GUY',
  'GIRASOLE Energies',
  'Les Sabots, 03230 Chevagnes, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: MARTEL 184 Construction
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-95686-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'MARTEL 184 Construction' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'MARTEL 184 Construction',
  'GIRASOLE Energies',
  'Lieudit Les Ribières, 23240 Le Grand Bourg',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: BOUCHARDY 203 LOC
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-95689-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'BOUCHARDY 203 LOC' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'BOUCHARDY 203 LOC',
  'GIRASOLE Energies',
  'Saint-Martin, 23320 Saint-Vaury, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: BOULOIR 206 LOC
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-95691-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'BOULOIR 206 LOC' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'BOULOIR 206 LOC',
  'GIRASOLE Energies',
  '23240 Le Grand-Bourg, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Renaud Sonnard
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-83431-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Renaud Sonnard' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Renaud Sonnard',
  'GIRASOLE Energies',
  'Les grandes versaines, 79160 Villiers-en-Plaine, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Fabrice COMBY
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-96546-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Fabrice COMBY' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Fabrice COMBY',
  'GIRASOLE Energies',
  'Besse, 19210 Saint-Éloy-les-Tuileries, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Julien Vaudin
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-82076-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Julien Vaudin' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Julien Vaudin',
  'GIRASOLE Energies',
  'Les Jacquets, 03230 Chevagnes, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Richard VAN ZANTEN
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-98584-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Richard VAN ZANTEN' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Richard VAN ZANTEN',
  'GIRASOLE Energies',
  'La Tuque, 47210 Parranquet, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: HANGAR Benoit BERTELOOT
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-20614-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'HANGAR Benoit BERTELOOT' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'HANGAR Benoit BERTELOOT',
  'GIRASOLE Energies',
  '127 Lieu Dit les Cleris 89150 Vernoy',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Laurent ROUX
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-15843-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Laurent ROUX' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Laurent ROUX',
  'GIRASOLE Energies',
  '10 Rue de Vareine 15260 Neuvéglise-sur-Truyère',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Serge Maltaverne
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-90361-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Serge Maltaverne' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Serge Maltaverne',
  'GIRASOLE Energies',
  '638 Chard, 71320 Sainte-Radegonde, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Christophe CARRERE n°2
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-33559-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Christophe CARRERE n°2' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Christophe CARRERE n°2',
  'GIRASOLE Energies',
  'Boy, 47600 Montagnac-sur-Auvignon, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Frédéric CASTET
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-95918-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Frédéric CASTET' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Frédéric CASTET',
  'GIRASOLE Energies',
  '11 Carrère de la Goutille, 31160 Estadens, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: MARTEL 183 LOC
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-95695-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'MARTEL 183 LOC' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'MARTEL 183 LOC',
  'GIRASOLE Energies',
  'LIEU-DIT LES RIBIERES LE GRAND BOURG',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Frederic Sinaud
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-86550-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Frederic Sinaud' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Frederic Sinaud',
  'GIRASOLE Energies',
  '11 La Quaire, 23240 Saint-Priest-la-Plaine, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Frederic Sinaud
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-90034-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Frederic Sinaud' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Frederic Sinaud',
  'GIRASOLE Energies',
  'La Drable, 23300 Saint Priest la feuille',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: HARAS DE LA MAJORIE/MANOHA
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-90189-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'HARAS DE LA MAJORIE/MANOHA' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'HARAS DE LA MAJORIE/MANOHA',
  'GIRASOLE Energies',
  'L''Homme, 07790 Saint-Alban-d''Ay, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Yannick CLEMENT
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-99373-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Yannick CLEMENT' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Yannick CLEMENT',
  'GIRASOLE Energies',
  'Gazailles, 31160 Estadens, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Concept-TY Chambray 2
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-3384-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Concept-TY Chambray 2' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Concept-TY Chambray 2',
  'GIRASOLE Energies',
  'Rue Etienne Cosson, 37170 Chambray-lès-Tours, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Patrick BLANCHET
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-35280-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Patrick BLANCHET' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Patrick BLANCHET',
  'GIRASOLE Energies',
  'Les Exclis, 26110 Venterol, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: MATHIEU Vincent
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-3334-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'MATHIEU Vincent' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'MATHIEU Vincent',
  'GIRASOLE Energies',
  'Lieu-dit Les Avals 11700 LA REDORTE',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Cheraud
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-82721-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Cheraud' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Cheraud',
  'GIRASOLE Energies',
  'Bellevue, 44260 Malville, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Frédéric CASTET
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-95919-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Frédéric CASTET' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Frédéric CASTET',
  'GIRASOLE Energies',
  '11 carrère de la Gentille, ESTADENS, 31160',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Didier - PRIEUR
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-32074-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Didier - PRIEUR' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Didier - PRIEUR',
  'GIRASOLE Energies',
  'Quartier de Montalivet 26120 Montmeyran',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Eric LOGNON
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-95309-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Eric LOGNON' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Eric LOGNON',
  'GIRASOLE Energies',
  'Château des Millets, 03230 Chevagnes, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar LAMIOT
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-30516-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar LAMIOT' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar LAMIOT',
  'GIRASOLE Energies',
  'La Gélopière, 42110 Feurs, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: VIEL
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-49814-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'VIEL' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'VIEL',
  'GIRASOLE Energies',
  'La Haute Bellangerais, 44390 Les Touches, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Serge Maltaverne
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-61191-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Serge Maltaverne' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Serge Maltaverne',
  'GIRASOLE Energies',
  '638  route Chard, 71320 Sainte-Radegonde, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: SCI KILJOR
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-3251-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'SCI KILJOR' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'SCI KILJOR',
  'GIRASOLE Energies',
  '6 Rue Albert Camus, 07800 La Voulte-sur-Rhône, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Benjamin CHASSON
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-96147-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Benjamin CHASSON' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Benjamin CHASSON',
  'GIRASOLE Energies',
  '465 Rue Jean Rostand, 26800 Portes-lès-Valence, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Bourgeois
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-81492-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Bourgeois' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Bourgeois',
  'GIRASOLE Energies',
  'Le Roscouët, 44440 Teillé, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: EARL GOUNY
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-3391-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'EARL GOUNY' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'EARL GOUNY',
  'GIRASOLE Energies',
  'Gouny, 47350 Escassefort, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Maxime Bayle
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-3085-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Maxime Bayle' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Maxime Bayle',
  'GIRASOLE Energies',
  'Château Lagoual, 11400 Lasbordes, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Commune De Pomas
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-97565-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Commune De Pomas' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Commune De Pomas',
  'GIRASOLE Energies',
  'Rue de la Mairie, 11250 Pomas, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: GFA LASCOMBES - ANTOINE MICOULEAU
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-95592-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'GFA LASCOMBES - ANTOINE MICOULEAU' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'GFA LASCOMBES - ANTOINE MICOULEAU',
  'GIRASOLE Energies',
  'Lascombes, 11170 Alzonne, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: HANGAR Gérald Guillet
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-34481-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'HANGAR Gérald Guillet' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'HANGAR Gérald Guillet',
  'GIRASOLE Energies',
  'Bois Rond, 17510 Les Éduts, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Joris SAINT MARTIN
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-35451-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Joris SAINT MARTIN' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Joris SAINT MARTIN',
  'GIRASOLE Energies',
  'Palancot, 32160 Jû-Belloc, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: GAYET 42
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-58166-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'GAYET 42' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'GAYET 42',
  'GIRASOLE Energies',
  '419 Chemin des Seigles, 42210 Craintilleux, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: Hangar Sebastien RUDELLE
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-95992-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'Hangar Sebastien RUDELLE' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'Hangar Sebastien RUDELLE',
  'GIRASOLE Energies',
  'Crayssac, 12120 Salmiech, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);


-- Audit: TOURNIER
INSERT INTO audits (
  audit_token, client_id, project_id, project_name, client_name,
  location, modules_enabled, status, created_at, updated_at
) VALUES (
  'GIRASOLE-98563-20251120',
  (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies'),
  (SELECT id FROM projects WHERE name = 'TOURNIER' AND client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies')),
  'TOURNIER',
  'GIRASOLE Energies',
  '548 Route de Marignac, 31430 Gratens, France',
  '["VISUAL"]',
  'pending',
  datetime('now'),
  datetime('now')
);
