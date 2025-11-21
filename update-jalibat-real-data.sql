-- Mise à jour des modules JALIBAT avec données réelles de l'audit EL
-- Généré automatiquement depuis l'image du plan de toiture
-- Date: 2025-01-21

BEGIN TRANSACTION;

UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-1' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-2' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-3' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-4' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-5' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-6' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'microfissures',
    severity_level = 2,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-7' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-8' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-9' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-10' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-11' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-12' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-13' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-14' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-15' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-16' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-17' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-18' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-19' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-20' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-21' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-22' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-23' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-24' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-25' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S1-26' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-1' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-2' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'microfissures',
    severity_level = 2,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-3' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-4' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-5' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-6' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-7' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-8' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-9' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-10' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-11' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-12' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-13' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-14' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-15' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-16' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-17' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-18' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-19' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-20' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-21' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-22' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-23' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S2-24' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-1' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'microfissures',
    severity_level = 2,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-2' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'microfissures',
    severity_level = 2,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-3' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'microfissures',
    severity_level = 2,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-4' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-5' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-6' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-7' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-8' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-9' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-10' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-11' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-12' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-13' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-14' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-15' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-16' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-17' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-18' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-19' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-20' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-21' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-22' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-23' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S3-24' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-1' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-2' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-3' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-4' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-5' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-6' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-7' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-8' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-9' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-10' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-11' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-12' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-13' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-14' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-15' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-16' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-17' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-18' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-19' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-20' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-21' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-22' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-23' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S4-24' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-1' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'microfissures',
    severity_level = 2,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-2' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'microfissures',
    severity_level = 2,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-3' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-4' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-5' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-6' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-7' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-8' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-9' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-10' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-11' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-12' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-13' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-14' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-15' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-16' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-17' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-18' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-19' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-20' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-21' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-22' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-23' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S5-24' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-1' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-2' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-3' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-4' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-5' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-6' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-7' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-8' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-9' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-10' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-11' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-12' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-13' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-14' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-15' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-16' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-17' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-18' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-19' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-20' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-21' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-22' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-23' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S6-24' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-1' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'microfissures',
    severity_level = 2,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-2' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'microfissures',
    severity_level = 2,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-3' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-4' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-5' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-6' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-7' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-8' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-9' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-10' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-11' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-12' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-13' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-14' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-15' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-16' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-17' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-18' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-19' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-20' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-21' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-22' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-23' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S7-24' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-1' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-2' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-3' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-4' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-5' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-6' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-7' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-8' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-9' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-10' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-11' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-12' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-13' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-14' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-15' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-16' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-17' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-18' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-19' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-20' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-21' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-22' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-23' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S8-24' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-1' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-2' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-3' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-4' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-5' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-6' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-7' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-8' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-9' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-10' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-11' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-12' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-13' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-14' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-15' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-16' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-17' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-18' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-19' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-20' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-21' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-22' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-23' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S9-24' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-1' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'none',
    severity_level = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-2' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-3' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-4' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-5' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-6' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-7' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-8' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-9' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-10' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-11' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-12' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-13' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-14' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-15' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-16' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-17' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-18' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-19' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-20' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-21' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-22' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-23' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
UPDATE el_modules 
SET defect_type = 'impact_cellulaire',
    severity_level = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE module_identifier = 'S10-24' 
  AND el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');

COMMIT;

-- Vérification des mises à jour
SELECT 
    'Modules mis à jour' as message,
    COUNT(*) as total,
    SUM(CASE WHEN defect_type != 'none' THEN 1 ELSE 0 END) as modules_avec_defauts,
    SUM(CASE WHEN defect_type = 'impact_cellulaire' THEN 1 ELSE 0 END) as impact_cellulaire,
    SUM(CASE WHEN defect_type = 'microfissures' THEN 1 ELSE 0 END) as microfissures,
    SUM(CASE WHEN defect_type = 'none' THEN 1 ELSE 0 END) as ok
FROM el_modules
WHERE el_audit_id = (SELECT id FROM el_audits WHERE audit_token = 'JALIBAT-2025-001');
