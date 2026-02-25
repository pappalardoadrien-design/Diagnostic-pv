/**
 * Parser PVServ - Courbes Sombres (Dark IV) + Tests Diodes Bypass
 * 
 * UN fichier .txt PVServ contient les DEUX types de mesures séquentiellement :
 *   1. Courbes sombres STRING : Uf > 100V, Rds ~16-17 Ohm, FF ~0.95+
 *   2. Tests DIODES BYPASS  : Uf <= 100V (typiquement 25V), Rds ~1-2 Ohm, FF variable
 * 
 * Discrimination automatique par le critère Uf (tension forward) :
 *   - Uf > 100V  → mesure au niveau du string complet
 *   - Uf <= 100V → mesure au niveau de la diode bypass
 * 
 * Structure d'un bloc dans le .txt :
 *   LAB/HP 31500/Mod 6298      ← Modèle appareil PVServ
 *   S.Nr.: 23.44.1286          ← N° de série PVServ
 *   Nr. 1                      ← N° de mesure
 *   FF    0,957                ← Fill Factor
 *   Rds   17,20                ← Résistance dynamique série (Ohm)
 *   Uf    772                  ← Tension forward (V) → CRITÈRE DISCRIMINATION
 *   bright                     ← Type de mesure
 *   U     I                    ← En-tête colonnes
 *   212   0,00                 ← Points (Tension V / Courant A)
 *   ...
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PVServMeasurement {
  voltage: number;  // U (V)
  current: number;  // I (A)
}

export interface PVServBlock {
  // Identification
  measurementNumber: number;  // Nr. X
  deviceName: string;         // LAB/HP ...
  serialNumber: string;       // S.Nr.: ...
  
  // Paramètres extraits
  fillFactor: number;         // FF (0-1)
  rds: number;                // Résistance dynamique série (Ohm)
  uf: number;                 // Tension forward (V)
  curveMode: string;          // 'bright' ou 'dark'
  
  // Points de mesure (U, I)
  points: PVServMeasurement[];
  
  // Classification automatique
  type: 'string' | 'diode';  // Déterminé par Uf
  
  // Valeurs calculées
  vMax: number;               // Tension max mesurée
  iMax: number;               // Courant max mesuré (abs)
  vfPerCell?: number;         // Vf/cellule (si string)
}

export interface PVServParseResult {
  // Métadonnées appareil
  deviceName: string;
  serialNumber: string;
  
  // Données séparées
  stringCurves: PVServBlock[];    // Courbes sombres (Uf > 100V)
  diodeCurves: PVServBlock[];     // Tests diodes (Uf <= 100V)
  
  // Statistiques
  stats: {
    totalBlocks: number;
    stringCount: number;
    diodeCount: number;
    // Strings
    avgFF_strings: number;
    avgRds_strings: number;
    avgUf_strings: number;
    minFF_strings: number;
    maxFF_strings: number;
    // Diodes
    avgFF_diodes: number;
    avgRds_diodes: number;
    avgUf_diodes: number;
    minFF_diodes: number;
    maxFF_diodes: number;
    // Anomalies
    anomalies: PVServAnomaly[];
  };
  
  // Erreurs de parsing
  warnings: string[];
}

export interface PVServAnomaly {
  blockIndex: number;
  measurementNumber: number;
  type: 'string' | 'diode';
  anomalyType: 'low_ff' | 'high_rds' | 'low_rds' | 'abnormal_uf';
  severity: 'ok' | 'warning' | 'critical';
  message: string;
  value: number;
  expected: string;
}

// ============================================================================
// SEUILS DE DISCRIMINATION ET D'ANOMALIE
// ============================================================================

const THRESHOLDS = {
  // Discrimination string vs diode
  UF_DISCRIMINANT: 100,  // V : Uf > 100 = string, <= 100 = diode
  
  // Seuils anomalie STRING
  STRING_FF_WARNING: 0.93,
  STRING_FF_CRITICAL: 0.90,
  STRING_RDS_WARNING: 20,   // Ohm
  STRING_RDS_CRITICAL: 25,  // Ohm
  
  // Seuils anomalie DIODE
  DIODE_FF_WARNING: 0.80,
  DIODE_FF_CRITICAL: 0.70,
  DIODE_RDS_HIGH_WARNING: 3.0,    // Ohm (résistance trop haute = mauvais contact)
  DIODE_RDS_LOW_WARNING: 0.5,     // Ohm (résistance trop basse = court-circuit possible)
};

// ============================================================================
// PARSER PRINCIPAL
// ============================================================================

export function parsePVServDarkIV(content: string, filename: string): PVServParseResult {
  const cleanContent = content.replace(/\r/g, '');
  const lines = cleanContent.split('\n');
  
  const warnings: string[] = [];
  const blocks: PVServBlock[] = [];
  
  let globalDeviceName = '';
  let globalSerialNumber = '';
  
  // Parse tous les blocs
  let i = 0;
  let currentDeviceName = '';
  let currentSerialNumber = '';
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Capturer le nom de l'appareil
    if (line.startsWith('LAB/') || line.startsWith('HP ') || line.match(/^[A-Z]{2,}\//)) {
      currentDeviceName = line;
      if (!globalDeviceName) globalDeviceName = line;
      i++;
      continue;
    }
    
    // Capturer le numéro de série
    if (line.startsWith('S.Nr')) {
      const match = line.match(/S\.Nr\.?:?\s*(.+)/);
      if (match) {
        currentSerialNumber = match[1].trim();
        if (!globalSerialNumber) globalSerialNumber = currentSerialNumber;
      }
      i++;
      continue;
    }
    
    // Début d'un bloc de mesure
    if (line.startsWith('Nr.')) {
      const block = parseBlock(lines, i, currentDeviceName, currentSerialNumber);
      if (block) {
        blocks.push(block);
      } else {
        warnings.push(`Bloc à la ligne ${i + 1} n'a pas pu être parsé`);
      }
      // Avancer au prochain bloc
      i++;
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (nextLine.startsWith('Nr.') || nextLine.startsWith('LAB/') || nextLine.startsWith('S.Nr')) {
          break;
        }
        i++;
      }
    } else {
      i++;
    }
  }
  
  // Séparer strings et diodes
  const stringCurves = blocks.filter(b => b.type === 'string');
  const diodeCurves = blocks.filter(b => b.type === 'diode');
  
  // Calculer statistiques
  const avgFF_strings = stringCurves.length > 0 
    ? stringCurves.reduce((s, b) => s + b.fillFactor, 0) / stringCurves.length : 0;
  const avgRds_strings = stringCurves.length > 0 
    ? stringCurves.reduce((s, b) => s + b.rds, 0) / stringCurves.length : 0;
  const avgUf_strings = stringCurves.length > 0 
    ? stringCurves.reduce((s, b) => s + b.uf, 0) / stringCurves.length : 0;
  
  const avgFF_diodes = diodeCurves.length > 0 
    ? diodeCurves.reduce((s, b) => s + b.fillFactor, 0) / diodeCurves.length : 0;
  const avgRds_diodes = diodeCurves.length > 0 
    ? diodeCurves.reduce((s, b) => s + b.rds, 0) / diodeCurves.length : 0;
  const avgUf_diodes = diodeCurves.length > 0 
    ? diodeCurves.reduce((s, b) => s + b.uf, 0) / diodeCurves.length : 0;
  
  // Détection d'anomalies
  const anomalies = detectAnomalies(blocks, avgFF_strings, avgRds_strings, avgFF_diodes, avgRds_diodes);
  
  return {
    deviceName: globalDeviceName,
    serialNumber: globalSerialNumber,
    stringCurves,
    diodeCurves,
    stats: {
      totalBlocks: blocks.length,
      stringCount: stringCurves.length,
      diodeCount: diodeCurves.length,
      avgFF_strings: round(avgFF_strings, 4),
      avgRds_strings: round(avgRds_strings, 2),
      avgUf_strings: round(avgUf_strings, 0),
      minFF_strings: stringCurves.length > 0 ? round(Math.min(...stringCurves.map(b => b.fillFactor)), 4) : 0,
      maxFF_strings: stringCurves.length > 0 ? round(Math.max(...stringCurves.map(b => b.fillFactor)), 4) : 0,
      avgFF_diodes: round(avgFF_diodes, 4),
      avgRds_diodes: round(avgRds_diodes, 2),
      avgUf_diodes: round(avgUf_diodes, 0),
      minFF_diodes: diodeCurves.length > 0 ? round(Math.min(...diodeCurves.map(b => b.fillFactor)), 4) : 0,
      maxFF_diodes: diodeCurves.length > 0 ? round(Math.max(...diodeCurves.map(b => b.fillFactor)), 4) : 0,
      anomalies,
    },
    warnings,
  };
}

// ============================================================================
// PARSE UN BLOC DE MESURE
// ============================================================================

function parseBlock(lines: string[], startIndex: number, deviceName: string, serialNumber: string): PVServBlock | null {
  let i = startIndex;
  let measurementNumber = 0;
  let fillFactor = 0;
  let rds = 0;
  let uf = 0;
  let curveMode = 'bright';
  const points: PVServMeasurement[] = [];
  
  // Parse Nr.
  const nrMatch = lines[i].trim().match(/Nr\.\s+(\d+)/);
  if (nrMatch) measurementNumber = parseInt(nrMatch[1]);
  i++;
  
  // Parse métadonnées jusqu'à U I
  let foundUI = false;
  while (i < lines.length && !foundUI) {
    const line = lines[i].trim();
    
    if (line.startsWith('Nr.') || line.startsWith('LAB/') || line.startsWith('S.Nr')) {
      break; // Nouveau bloc
    }
    
    if (line.startsWith('FF')) {
      const parts = line.split(/[\s\t]+/);
      if (parts.length >= 2) fillFactor = parseFloat(parts[1].replace(',', '.'));
    } else if (line.startsWith('Rds')) {
      const parts = line.split(/[\s\t]+/);
      if (parts.length >= 2) rds = parseFloat(parts[1].replace(',', '.'));
    } else if (line.startsWith('Uf')) {
      const parts = line.split(/[\s\t]+/);
      if (parts.length >= 2) uf = parseInt(parts[1]);
    } else if (line.toLowerCase() === 'dark' || line.toLowerCase() === 'bright') {
      curveMode = line.toLowerCase();
    } else if (line.match(/^U[\s\t]+I$/i)) {
      foundUI = true;
    }
    
    i++;
  }
  
  if (!foundUI) return null;
  
  // Parse points de mesure
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line || line.startsWith('Nr.') || line.startsWith('LAB/') || line.startsWith('S.Nr') || line.startsWith('Standby') || line.startsWith('USER')) {
      break;
    }
    
    const parts = line.split(/[\s\t]+/);
    if (parts.length >= 2) {
      const voltage = parseFloat(parts[0].replace(',', '.'));
      const current = parseFloat(parts[1].replace(',', '.'));
      if (!isNaN(voltage) && !isNaN(current)) {
        points.push({ voltage, current });
      } else {
        break;
      }
    } else {
      break;
    }
    i++;
  }
  
  if (points.length === 0) return null;
  
  const type: 'string' | 'diode' = uf > THRESHOLDS.UF_DISCRIMINANT ? 'string' : 'diode';
  const vMax = Math.max(...points.map(p => p.voltage));
  const iMax = Math.max(...points.map(p => Math.abs(p.current)));
  
  return {
    measurementNumber,
    deviceName,
    serialNumber,
    fillFactor,
    rds,
    uf,
    curveMode,
    points,
    type,
    vMax,
    iMax,
  };
}

// ============================================================================
// DÉTECTION D'ANOMALIES
// ============================================================================

function detectAnomalies(
  blocks: PVServBlock[],
  avgFF_str: number, avgRds_str: number,
  avgFF_dio: number, avgRds_dio: number
): PVServAnomaly[] {
  const anomalies: PVServAnomaly[] = [];
  
  for (let idx = 0; idx < blocks.length; idx++) {
    const b = blocks[idx];
    
    if (b.type === 'string') {
      // FF trop bas pour un string
      if (b.fillFactor < THRESHOLDS.STRING_FF_CRITICAL) {
        anomalies.push({
          blockIndex: idx, measurementNumber: b.measurementNumber, type: 'string',
          anomalyType: 'low_ff', severity: 'critical',
          message: `String Nr.${b.measurementNumber}: FF=${b.fillFactor.toFixed(3)} très bas (seuil: ${THRESHOLDS.STRING_FF_CRITICAL})`,
          value: b.fillFactor, expected: `> ${THRESHOLDS.STRING_FF_CRITICAL}`
        });
      } else if (b.fillFactor < THRESHOLDS.STRING_FF_WARNING) {
        anomalies.push({
          blockIndex: idx, measurementNumber: b.measurementNumber, type: 'string',
          anomalyType: 'low_ff', severity: 'warning',
          message: `String Nr.${b.measurementNumber}: FF=${b.fillFactor.toFixed(3)} dégradé (seuil: ${THRESHOLDS.STRING_FF_WARNING})`,
          value: b.fillFactor, expected: `> ${THRESHOLDS.STRING_FF_WARNING}`
        });
      }
      
      // Rds trop élevé pour un string
      if (b.rds > THRESHOLDS.STRING_RDS_CRITICAL) {
        anomalies.push({
          blockIndex: idx, measurementNumber: b.measurementNumber, type: 'string',
          anomalyType: 'high_rds', severity: 'critical',
          message: `String Nr.${b.measurementNumber}: Rds=${b.rds.toFixed(1)}Ω trop élevé (seuil: ${THRESHOLDS.STRING_RDS_CRITICAL}Ω)`,
          value: b.rds, expected: `< ${THRESHOLDS.STRING_RDS_CRITICAL}Ω`
        });
      } else if (b.rds > THRESHOLDS.STRING_RDS_WARNING) {
        anomalies.push({
          blockIndex: idx, measurementNumber: b.measurementNumber, type: 'string',
          anomalyType: 'high_rds', severity: 'warning',
          message: `String Nr.${b.measurementNumber}: Rds=${b.rds.toFixed(1)}Ω élevé (seuil: ${THRESHOLDS.STRING_RDS_WARNING}Ω)`,
          value: b.rds, expected: `< ${THRESHOLDS.STRING_RDS_WARNING}Ω`
        });
      }
    }
    
    if (b.type === 'diode') {
      // FF trop bas pour une diode
      if (b.fillFactor < THRESHOLDS.DIODE_FF_CRITICAL) {
        anomalies.push({
          blockIndex: idx, measurementNumber: b.measurementNumber, type: 'diode',
          anomalyType: 'low_ff', severity: 'critical',
          message: `Diode Nr.${b.measurementNumber}: FF=${b.fillFactor.toFixed(3)} très bas - possible défaut diode (seuil: ${THRESHOLDS.DIODE_FF_CRITICAL})`,
          value: b.fillFactor, expected: `> ${THRESHOLDS.DIODE_FF_CRITICAL}`
        });
      } else if (b.fillFactor < THRESHOLDS.DIODE_FF_WARNING) {
        anomalies.push({
          blockIndex: idx, measurementNumber: b.measurementNumber, type: 'diode',
          anomalyType: 'low_ff', severity: 'warning',
          message: `Diode Nr.${b.measurementNumber}: FF=${b.fillFactor.toFixed(3)} dégradé (seuil: ${THRESHOLDS.DIODE_FF_WARNING})`,
          value: b.fillFactor, expected: `> ${THRESHOLDS.DIODE_FF_WARNING}`
        });
      }
      
      // Rds anormal pour une diode
      if (b.rds > THRESHOLDS.DIODE_RDS_HIGH_WARNING) {
        anomalies.push({
          blockIndex: idx, measurementNumber: b.measurementNumber, type: 'diode',
          anomalyType: 'high_rds', severity: 'warning',
          message: `Diode Nr.${b.measurementNumber}: Rds=${b.rds.toFixed(2)}Ω élevé - mauvais contact possible`,
          value: b.rds, expected: `< ${THRESHOLDS.DIODE_RDS_HIGH_WARNING}Ω`
        });
      }
      if (b.rds < THRESHOLDS.DIODE_RDS_LOW_WARNING) {
        anomalies.push({
          blockIndex: idx, measurementNumber: b.measurementNumber, type: 'diode',
          anomalyType: 'low_rds', severity: 'warning',
          message: `Diode Nr.${b.measurementNumber}: Rds=${b.rds.toFixed(2)}Ω très bas - court-circuit possible`,
          value: b.rds, expected: `> ${THRESHOLDS.DIODE_RDS_LOW_WARNING}Ω`
        });
      }
    }
  }
  
  return anomalies;
}

// ============================================================================
// VALIDATION
// ============================================================================

export function isValidPVServDarkFile(content: string): boolean {
  const lines = content.split('\n');
  const hasFF = lines.some(l => l.trim().match(/^FF[\s\t]/));
  const hasUf = lines.some(l => l.trim().match(/^Uf[\s\t]/));
  const hasRds = lines.some(l => l.trim().match(/^Rds[\s\t]/));
  const hasHeader = lines.some(l => l.trim().match(/^U[\s\t]+I$/));
  const hasNr = lines.some(l => l.trim().match(/^Nr\.\s+\d+/));
  
  return hasFF && hasUf && hasRds && hasHeader && hasNr;
}

// ============================================================================
// UTILS
// ============================================================================

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
