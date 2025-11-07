-- ================================================================
-- Migration 0003: Configuration Électrique (Onduleurs + Strings)
-- ================================================================
-- Création: 2025-11-07
-- Description: Tables pour configuration électrique des centrales PV
--              (onduleurs, attribution strings, boîtes de jonction)
-- ================================================================

-- Table: Onduleurs (Inverters)
CREATE TABLE IF NOT EXISTS pv_inverters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id INTEGER NOT NULL,
    inverter_name TEXT NOT NULL,              -- "Onduleur 1", "Onduleur 2"
    inverter_model TEXT,                      -- "Huawei SUN2000-100KTL", "Fronius Symo"
    inverter_brand TEXT,                      -- "Huawei", "Fronius", "SMA"
    rated_power_kw REAL NOT NULL,             -- 100.0 kW
    mppt_count INTEGER DEFAULT 4,             -- Nombre de trackers MPPT
    efficiency_percent REAL DEFAULT 98.0,     -- Rendement onduleur (%)
    status TEXT DEFAULT 'active',             -- 'active', 'maintenance', 'offline'
    installation_date DATE,                   -- Date installation
    serial_number TEXT,                       -- Numéro de série
    notes TEXT,                               -- Notes techniques
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES pv_zones(id) ON DELETE CASCADE
);

-- Index pour recherche rapide par zone
CREATE INDEX IF NOT EXISTS idx_inverters_zone_id ON pv_inverters(zone_id);
CREATE INDEX IF NOT EXISTS idx_inverters_status ON pv_inverters(status);

-- Table: Attribution Strings → Onduleurs
CREATE TABLE IF NOT EXISTS pv_string_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inverter_id INTEGER NOT NULL,
    string_number INTEGER NOT NULL,           -- Numéro du string (1-N)
    mppt_input INTEGER,                       -- Entrée MPPT (1-4, optionnel)
    string_voltage_v REAL,                    -- Tension string (V)
    string_current_a REAL,                    -- Courant string (A)
    notes TEXT,                               -- Notes spécifiques
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inverter_id) REFERENCES pv_inverters(id) ON DELETE CASCADE,
    -- Contrainte: Un string ne peut être attribué qu'à un seul onduleur
    UNIQUE(inverter_id, string_number)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_string_assignments_inverter ON pv_string_assignments(inverter_id);
CREATE INDEX IF NOT EXISTS idx_string_assignments_string ON pv_string_assignments(string_number);

-- Table: Boîtes de Jonction (Junction Boxes)
CREATE TABLE IF NOT EXISTS pv_junction_boxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id INTEGER NOT NULL,
    box_name TEXT NOT NULL,                   -- "BJ1", "BJ-Nord", "Coffret A"
    box_type TEXT DEFAULT 'standard',         -- 'standard', 'dc', 'ac'
    inverter_id INTEGER,                      -- Onduleur connecté (optionnel)
    location_description TEXT,                -- "Coin Nord-Est toiture"
    latitude REAL,                            -- Position GPS
    longitude REAL,
    installation_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES pv_zones(id) ON DELETE CASCADE,
    FOREIGN KEY (inverter_id) REFERENCES pv_inverters(id) ON DELETE SET NULL
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_junction_boxes_zone_id ON pv_junction_boxes(zone_id);
CREATE INDEX IF NOT EXISTS idx_junction_boxes_inverter ON pv_junction_boxes(inverter_id);

-- ================================================================
-- Triggers: Mise à jour automatique updated_at
-- ================================================================

CREATE TRIGGER IF NOT EXISTS update_inverters_timestamp 
AFTER UPDATE ON pv_inverters
BEGIN
    UPDATE pv_inverters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_string_assignments_timestamp 
AFTER UPDATE ON pv_string_assignments
BEGIN
    UPDATE pv_string_assignments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_junction_boxes_timestamp 
AFTER UPDATE ON pv_junction_boxes
BEGIN
    UPDATE pv_junction_boxes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ================================================================
-- Vues: Statistiques Configuration Électrique
-- ================================================================

-- Vue: Résumé par onduleur (modules, puissance, strings)
CREATE VIEW IF NOT EXISTS v_inverter_summary AS
SELECT 
    i.id AS inverter_id,
    i.zone_id,
    i.inverter_name,
    i.inverter_model,
    i.rated_power_kw,
    i.mppt_count,
    COUNT(DISTINCT sa.string_number) AS assigned_strings,
    COUNT(m.id) AS module_count,
    SUM(m.power_wp) / 1000.0 AS total_power_kwp,
    ROUND(SUM(m.power_wp) / 1000.0 / i.rated_power_kw * 100, 1) AS load_percent
FROM pv_inverters i
LEFT JOIN pv_string_assignments sa ON i.id = sa.inverter_id
LEFT JOIN pv_modules m ON sa.string_number = m.string_number AND m.zone_id = i.zone_id
GROUP BY i.id;

-- Vue: Validation configuration (warnings)
CREATE VIEW IF NOT EXISTS v_electrical_validation AS
SELECT 
    z.id AS zone_id,
    z.zone_name,
    z.string_count AS expected_strings,
    COUNT(DISTINCT sa.string_number) AS assigned_strings,
    z.string_count - COUNT(DISTINCT sa.string_number) AS unassigned_strings,
    COUNT(DISTINCT i.id) AS inverter_count,
    SUM(i.rated_power_kw) AS total_inverter_power_kw,
    SUM(m.power_wp) / 1000.0 AS total_module_power_kwp,
    CASE 
        WHEN COUNT(DISTINCT sa.string_number) < z.string_count THEN 'WARNING: Strings non attribués'
        WHEN SUM(m.power_wp) / 1000.0 > SUM(i.rated_power_kw) * 1.2 THEN 'WARNING: Surdimensionnement onduleurs'
        ELSE 'OK'
    END AS validation_status
FROM pv_zones z
LEFT JOIN pv_inverters i ON z.id = i.zone_id
LEFT JOIN pv_string_assignments sa ON i.id = sa.inverter_id
LEFT JOIN pv_modules m ON sa.string_number = m.string_number AND m.zone_id = z.id
GROUP BY z.id;

-- ================================================================
-- Données Initiales: Onduleurs JALIBAT (Exemple)
-- ================================================================

-- Identifier zone JALIBAT
-- NOTE: Cette insertion sera adaptée selon votre base réelle

-- Exemple: Créer 2 onduleurs pour JALIBAT si la zone existe
-- INSERT INTO pv_inverters (zone_id, inverter_name, inverter_model, inverter_brand, rated_power_kw, mppt_count)
-- SELECT id, 'Onduleur 1', 'Huawei SUN2000-100KTL', 'Huawei', 100.0, 4
-- FROM pv_zones WHERE zone_name = 'JALIBAT - Zone Principale' LIMIT 1;

-- INSERT INTO pv_inverters (zone_id, inverter_name, inverter_model, inverter_brand, rated_power_kw, mppt_count)
-- SELECT id, 'Onduleur 2', 'Huawei SUN2000-100KTL', 'Huawei', 100.0, 4
-- FROM pv_zones WHERE zone_name = 'JALIBAT - Zone Principale' LIMIT 1;

-- ================================================================
-- Fin Migration 0003
-- ================================================================
