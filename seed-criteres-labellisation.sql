-- Seed: Critères de labellisation DiagPV
-- Basé sur vision Arthur: Créer le standard professionnel du diagnostiqueur PV

-- ============================================================================
-- CATÉGORIE: CERTIFICATIONS (Obligatoire)
-- ============================================================================
INSERT INTO criteres_labellisation (code, nom, description, categorie, obligatoire, points, ordre) VALUES
('CERT_IEC62446', 'Certification IEC 62446-1', 'Certification sur la norme IEC 62446-1 (Exigences système photovoltaïque)', 'certification', 1, 100, 1),
('CERT_NFC15100', 'Certification NF C 15-100', 'Certification installations électriques basse tension', 'certification', 1, 100, 2),
('CERT_THERMOGRAPHIE', 'Habilitation Thermographie', 'Formation thermographie IR drone et sol', 'certification', 1, 80, 3),
('CERT_ELECTROLUM', 'Formation Électroluminescence', 'Maîtrise électroluminescence nocturne', 'certification', 0, 60, 4);

-- ============================================================================
-- CATÉGORIE: EXPÉRIENCE (Obligatoire)
-- ============================================================================
INSERT INTO criteres_labellisation (code, nom, description, categorie, obligatoire, points, ordre) VALUES
('EXP_MIN_2ANS', 'Expérience minimum 2 ans', '2 années d\'expérience en audit photovoltaïque', 'experience', 1, 80, 10),
('EXP_50_AUDITS', 'Minimum 50 audits réalisés', 'Avoir réalisé au moins 50 audits PV', 'experience', 1, 60, 11),
('EXP_DIVERSITE', 'Diversité installations', 'Expérience sur différents types (résidentiel, tertiaire, industriel)', 'experience', 0, 40, 12);

-- ============================================================================
-- CATÉGORIE: ÉQUIPEMENTS (Obligatoire)
-- ============================================================================
INSERT INTO criteres_labellisation (code, nom, description, categorie, obligatoire, points, ordre) VALUES
('EQUIP_CAMERA_THERMO', 'Caméra thermique professionnelle', 'Caméra thermique résolution min 320x240', 'equipement', 1, 80, 20),
('EQUIP_CAMERA_EL', 'Caméra électroluminescence', 'Caméra EL pour détection microfissures', 'equipement', 1, 80, 21),
('EQUIP_TESTEUR_IV', 'Testeur courbes I-V', 'Appareil mesure courbes I-V (sombres + référence)', 'equipement', 1, 80, 22),
('EQUIP_MULTIMETRE', 'Multimètre professionnel', 'Multimètre pour tests isolement et continuité', 'equipement', 1, 40, 23),
('EQUIP_DRONE', 'Drone avec caméra thermique', 'Drone pour thermographie aérienne (optionnel)', 'equipement', 0, 60, 24);

-- ============================================================================
-- CATÉGORIE: ASSURANCES (Obligatoire)
-- ============================================================================
INSERT INTO criteres_labellisation (code, nom, description, categorie, obligatoire, points, ordre) VALUES
('ASSUR_RC_PRO', 'RC Professionnelle', 'Assurance Responsabilité Civile Professionnelle (min 500k€)', 'assurance', 1, 100, 30),
('ASSUR_DECENNALE', 'Décennale', 'Assurance décennale (si applicable selon activité)', 'assurance', 0, 80, 31);

-- ============================================================================
-- CATÉGORIE: QUALITÉ (Recommandé)
-- ============================================================================
INSERT INTO criteres_labellisation (code, nom, description, categorie, obligatoire, points, ordre) VALUES
('QUAL_DELAI_5J', 'Délais rapports < 5 jours', 'Engagement délai remise rapports max 5 jours ouvrés', 'qualite', 0, 60, 40),
('QUAL_NOTE_45', 'Note moyenne > 4/5', 'Note moyenne clients supérieure à 4/5', 'qualite', 0, 40, 41),
('QUAL_TAUX_CONF_95', 'Taux conformité > 95%', 'Taux de conformité procédures DiagPV > 95%', 'qualite', 0, 40, 42);

-- ============================================================================
-- CATÉGORIE: FORMATION CONTINUE (Recommandé)
-- ============================================================================
INSERT INTO criteres_labellisation (code, nom, description, categorie, obligatoire, points, ordre) VALUES
('FORM_ANNUELLE', 'Formation continue annuelle', 'Participation formation DiagPV 1x/an minimum', 'formation', 0, 40, 50),
('FORM_VEILLE_NORMES', 'Veille normative', 'Engagement suivi évolutions normes (IEC, NF, DTU)', 'formation', 0, 20, 51);

-- ============================================================================
-- CATÉGORIE: ÉTHIQUE (Obligatoire)
-- ============================================================================
INSERT INTO criteres_labellisation (code, nom, description, categorie, obligatoire, points, ordre) VALUES
('ETH_INDEPENDANCE', 'Indépendance', 'Engagement indépendance totale (aucun lien installateur/fabricant)', 'ethique', 1, 100, 60),
('ETH_CONFIDENTIALITE', 'Confidentialité', 'Engagement confidentialité données clients', 'ethique', 1, 80, 61),
('ETH_CHARTE', 'Adhésion charte DiagPV', 'Signature charte déontologique DiagPV', 'ethique', 1, 100, 62);
