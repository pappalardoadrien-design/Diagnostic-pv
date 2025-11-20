-- Mise à jour des projets GIRASOLE avec colonnes is_girasole et id_referent
-- Version production (remote) - Ne modifie que les projets, pas les audits

-- Marquée tous les projets du client GIRASOLE comme is_girasole = 1
UPDATE projects 
SET is_girasole = 1
WHERE client_id = (SELECT id FROM crm_clients WHERE company_name = 'GIRASOLE Energies');

-- Maintenant attribuer les id_referent spécifiques selon les noms de projets
-- (Liste des 52 centrales avec leurs ID référents)

UPDATE projects SET id_referent = '31971' WHERE name = 'Antunez - SCI ANAUJA';
UPDATE projects SET id_referent = '32010' WHERE name = 'EARL CADOT';
UPDATE projects SET id_referent = '31972' WHERE name = 'EARL METZ';
UPDATE projects SET id_referent = '31973' WHERE name = 'SCEA Chanteclair';
UPDATE projects SET id_referent = '31995' WHERE name = 'GAEC DE LA VALLEE DE MAI';
UPDATE projects SET id_referent = '31999' WHERE name = 'EARL GOUDENOVE VINCENT';
UPDATE projects SET id_referent = '31994' WHERE name = 'GAEC DU HAUT BREUIL';
UPDATE projects SET id_referent = '31996' WHERE name = 'EARL DU CHATEL';
UPDATE projects SET id_referent = '31974' WHERE name = 'GAEC FAUVRE';
UPDATE projects SET id_referent = '32002' WHERE name = 'M. ANDRE MAZURIER';
UPDATE projects SET id_referent = '32001' WHERE name = 'GAEC BREZILLON';
UPDATE projects SET id_referent = '31997' WHERE name = 'EARL DE PIED LONG';
UPDATE projects SET id_referent = '31998' WHERE name = 'GAEC LES 2 M';
UPDATE projects SET id_referent = '32016' WHERE name = 'M et Mme SERRE Bernard';
UPDATE projects SET id_referent = '31989' WHERE name = 'EARL VALLI DANIEL';
UPDATE projects SET id_referent = '32006' WHERE name = 'M. BENOIT LANDIVIER';
UPDATE projects SET id_referent = '32007' WHERE name = 'M et Mme LEPRINCE';
UPDATE projects SET id_referent = '32011' WHERE name = 'GAEC La Ferme Nourry';
UPDATE projects SET id_referent = '58043' WHERE name = 'VAULIN ELEVAGE';
UPDATE projects SET id_referent = '58164' WHERE name = 'EARL DU FRAISSE';
UPDATE projects SET id_referent = '95992' WHERE name = 'Hangar Sebastien RUDELLE';
UPDATE projects SET id_referent = '48584' WHERE name = 'SAS FROMAGERIE DUROUX';
UPDATE projects SET id_referent = '58165' WHERE name = 'SAS FROMAGERIE DUROUX 2';
UPDATE projects SET id_referent = '58162' WHERE name = 'GAEC DU VERDIER';
UPDATE projects SET id_referent = '32004' WHERE name = 'GAEC DU TEILLEUX';
UPDATE projects SET id_referent = '32009' WHERE name = 'GAEC LES SALINES';
UPDATE projects SET id_referent = '58160' WHERE name = 'EARL MANSSART THIERRY';
UPDATE projects SET id_referent = '32008' WHERE name = 'SARL LAITERIE COL';
UPDATE projects SET id_referent = '58158' WHERE name = 'SCEA DUFFAU';
UPDATE projects SET id_referent = '32014' WHERE name = 'EARL FABRE Serge et David';
UPDATE projects SET id_referent = '58159' WHERE name = 'EARL LAFARGUE-DIEUMEGARD';
UPDATE projects SET id_referent = '32017' WHERE name = 'EARL MAS DEL TRONC';
UPDATE projects SET id_referent = '32015' WHERE name = 'EARL LA RIVIERO';
UPDATE projects SET id_referent = '58161' WHERE name = 'EARL DU GRAND CHESNE';
UPDATE projects SET id_referent = '52943' WHERE name = 'EARL HUCHET JEHAN ET ROMAIN';
UPDATE projects SET id_referent = '58166' WHERE name = 'GAYET 42';
UPDATE projects SET id_referent = '31993' WHERE name = 'DUPRAT';
UPDATE projects SET id_referent = '32000' WHERE name = 'EARL DE LA VALLEE';
UPDATE projects SET id_referent = '98563' WHERE name = 'TOURNIER';

-- Les 13 centrales avec TOITURE (audit DOUBLE)
UPDATE projects SET id_referent = '32003', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'SCEA Bourbonnaise';
UPDATE projects SET id_referent = '32005', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'EARL YOHANN GENESTE';
UPDATE projects SET id_referent = '32012', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'GAEC DE LA PETITE BELLE';
UPDATE projects SET id_referent = '32013', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'EARL BERTIN-BEILLARD';
UPDATE projects SET id_referent = '48583', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'ELEVAGE SOULIER';
UPDATE projects SET id_referent = '52942', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'MADAME LE SCIELLOUR ISABELLE';
UPDATE projects SET id_referent = '58050', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'GAEC DE LA MEIGNANNE';
UPDATE projects SET id_referent = '58051', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'GAEC COCAGNE';
UPDATE projects SET id_referent = '58154', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'GAEC DE LA PLAINE';
UPDATE projects SET id_referent = '58156', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'GAEC DE LA VERRERIE';
UPDATE projects SET id_referent = '58157', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'EARL DANIEL ET SYLVAIN BROCHARD';
UPDATE projects SET id_referent = '58163', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'SCEA du Bourg';
UPDATE projects SET id_referent = '88906', audit_types = '["CONFORMITE", "TOITURE"]' WHERE name = 'GAEC LA SALMAGNE';
