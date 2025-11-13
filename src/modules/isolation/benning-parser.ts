/**
 * Benning CSV Parser - Import mesures isolation
 * Format: Benning IT 130 export CSV (semicolon-separated)
 */

export interface BenningCSVRow {
  index: number;
  rpe_ohm: number | null;
  voc_vdc: number | null;
  isc_adc: number | null;
  riso_mohm: number; // Résistance isolation (MΩ)
  viso_v: number; // Tension test (V)
  time: string; // HH:MM:SS
  date: string; // DD/MM/YYYY
}

export interface BenningCSVMetadata {
  serialNumber: string;
  deviceModel: string;
  totalMeasurements: number;
  firstMeasurement: Date;
  lastMeasurement: Date;
  avgRiso: number;
  minRiso: number;
  maxRiso: number;
}

export interface BenningParseResult {
  success: boolean;
  metadata: BenningCSVMetadata;
  measurements: BenningCSVRow[];
  errors: string[];
}

/**
 * Parse CSV Benning format
 */
export function parseBenningCSV(csvContent: string): BenningParseResult {
  const errors: string[] = [];
  const measurements: BenningCSVRow[] = [];
  
  try {
    // Split lines
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length < 3) {
      return {
        success: false,
        metadata: {} as BenningCSVMetadata,
        measurements: [],
        errors: ['Fichier CSV vide ou trop court']
      };
    }
    
    // Parse Serial Number (ligne 1)
    const serialLine = lines[0];
    const serialMatch = serialLine.match(/Serial no;\s*([^;]+)/);
    const serialNumber = serialMatch ? serialMatch[1].trim() : 'Unknown';
    
    // Parse Headers (ligne 2)
    const headers = lines[1].split(';').map(h => h.trim());
    // Expected: Index;Rpe (Ohm);Voc (VDC);Isc (ADC);Riso (MOhm);Viso (V);HH:MM:SS; DD/MM/YYYY
    
    // Find column indexes
    const indexCol = headers.findIndex(h => h.toLowerCase().includes('index'));
    const rpeCol = headers.findIndex(h => h.toLowerCase().includes('rpe'));
    const vocCol = headers.findIndex(h => h.toLowerCase().includes('voc'));
    const iscCol = headers.findIndex(h => h.toLowerCase().includes('isc'));
    const risoCol = headers.findIndex(h => h.toLowerCase().includes('riso'));
    const visoCol = headers.findIndex(h => h.toLowerCase().includes('viso'));
    const timeCol = headers.findIndex(h => h.match(/hh:mm:ss/i));
    const dateCol = headers.findIndex(h => h.match(/dd\/mm\/yyyy/i));
    
    if (risoCol === -1 || dateCol === -1) {
      errors.push('Colonnes Riso ou Date introuvables dans headers');
      return {
        success: false,
        metadata: {} as BenningCSVMetadata,
        measurements: [],
        errors
      };
    }
    
    // Parse data rows (skip header lines)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(';').map(c => c.trim());
      
      // Skip empty rows (check if all columns empty)
      const isEmpty = cols.every(col => col === '' || col === ';;;;;;');
      if (isEmpty) continue;
      
      // Skip if Riso empty
      if (!cols[risoCol] || cols[risoCol] === '') continue;
      
      try {
        // Parse numeric values (handle European format: comma as decimal)
        const parseNumber = (str: string | undefined): number | null => {
          if (!str || str === '') return null;
          // Replace comma with dot for European decimal format
          const normalized = str.replace(',', '.');
          const num = parseFloat(normalized);
          return isNaN(num) ? null : num;
        };
        
        const index = parseNumber(cols[indexCol]);
        const rpe_ohm = parseNumber(cols[rpeCol]);
        const voc_vdc = parseNumber(cols[vocCol]);
        const isc_adc = parseNumber(cols[iscCol]);
        const riso_mohm = parseNumber(cols[risoCol]);
        const viso_v = parseNumber(cols[visoCol]);
        const time = cols[timeCol] || '';
        const date = cols[dateCol] || '';
        
        // Validation: Riso required
        if (riso_mohm === null) {
          errors.push(`Ligne ${i + 1}: Riso vide`);
          continue;
        }
        
        measurements.push({
          index: index || i - 1,
          rpe_ohm,
          voc_vdc,
          isc_adc,
          riso_mohm,
          viso_v: viso_v || 1000, // Default 1000V si manquant
          time,
          date
        });
        
      } catch (err) {
        errors.push(`Ligne ${i + 1}: Erreur parsing - ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }
    
    // Calculate metadata
    if (measurements.length === 0) {
      return {
        success: false,
        metadata: {} as BenningCSVMetadata,
        measurements: [],
        errors: ['Aucune mesure valide trouvée']
      };
    }
    
    const risoValues = measurements.map(m => m.riso_mohm);
    const avgRiso = risoValues.reduce((a, b) => a + b, 0) / risoValues.length;
    const minRiso = Math.min(...risoValues);
    const maxRiso = Math.max(...risoValues);
    
    // Parse first/last dates
    const parseDate = (dateStr: string, timeStr: string): Date => {
      // Format: DD/MM/YYYY and HH:MM:SS
      const [day, month, year] = dateStr.split('/').map(s => parseInt(s));
      const [hour, minute, second] = timeStr.split(':').map(s => parseInt(s));
      return new Date(year, month - 1, day, hour, minute, second);
    };
    
    const firstMeasurement = parseDate(measurements[0].date, measurements[0].time);
    const lastMeasurement = parseDate(
      measurements[measurements.length - 1].date,
      measurements[measurements.length - 1].time
    );
    
    const metadata: BenningCSVMetadata = {
      serialNumber,
      deviceModel: 'Benning IT 130',
      totalMeasurements: measurements.length,
      firstMeasurement,
      lastMeasurement,
      avgRiso: Math.round(avgRiso * 100) / 100,
      minRiso: Math.round(minRiso * 100) / 100,
      maxRiso: Math.round(maxRiso * 100) / 100
    };
    
    return {
      success: true,
      metadata,
      measurements,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      metadata: {} as BenningCSVMetadata,
      measurements: [],
      errors: [`Erreur parsing CSV: ${error instanceof Error ? error.message : 'Unknown'}`]
    };
  }
}

/**
 * Convert Benning measurement to Isolation Test format
 * 
 * IMPORTANT: Configuration mapping par défaut (à ajuster selon terrain):
 * - Riso → dcPositiveToEarth (hypothèse: mesure DC+ to Earth)
 * - Les 3 autres mesures restent NULL (à compléter manuellement ou import autre fichier)
 */
export interface BenningToIsolationTestOptions {
  plantId?: number;
  zoneId?: number;
  auditElToken?: string;
  operatorName?: string;
  testType?: 'COMMISSIONING' | 'MAINTENANCE' | 'POST_INTERVENTION' | 'POST_SINISTRE';
  
  // Mapping configuration (modifiable selon retour terrain)
  risoMapping?: 'dcPositiveToEarth' | 'dcNegativeToEarth' | 'dcPositiveToNegative' | 'acToEarth';
}

export function benningMeasurementToIsolationTest(
  measurement: BenningCSVRow,
  metadata: BenningCSVMetadata,
  options: BenningToIsolationTestOptions = {}
) {
  // Parse date DD/MM/YYYY
  if (!measurement.date || measurement.date.trim() === '') {
    throw new Error('Date manquante');
  }
  
  // Support both / and . as separator (Benning uses .)
  const separator = measurement.date.includes('.') ? '.' : '/';
  const dateParts = measurement.date.split(separator);
  if (dateParts.length !== 3) {
    throw new Error(`Format date invalide: ${measurement.date}`);
  }
  
  const day = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]);
  const year = parseInt(dateParts[2]);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error(`Date non parsable: ${measurement.date}`);
  }
  
  const testDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  
  // Mapping Riso (par défaut: DC+ to Earth)
  const risoMapping = options.risoMapping || 'dcPositiveToEarth';
  
  const testData: any = {
    testDate,
    testType: options.testType || 'COMMISSIONING',
    operatorName: options.operatorName || null,
    equipmentUsed: `${metadata.deviceModel} (SN: ${metadata.serialNumber})`,
    
    // Mapping Riso selon configuration
    dcPositiveToEarth: risoMapping === 'dcPositiveToEarth' ? measurement.riso_mohm : null,
    dcNegativeToEarth: risoMapping === 'dcNegativeToEarth' ? measurement.riso_mohm : null,
    dcPositiveToNegative: risoMapping === 'dcPositiveToNegative' ? measurement.riso_mohm : null,
    acToEarth: risoMapping === 'acToEarth' ? measurement.riso_mohm : null,
    
    // Conditions mesure (si disponibles)
    temperatureCelsius: null, // Benning CSV ne contient pas T°
    humidityPercent: null, // Benning CSV ne contient pas humidité
    weatherConditions: null,
    
    // Metadata
    notes: `Import Benning CSV - Mesure #${measurement.index} - Heure: ${measurement.time} - Tension test: ${measurement.viso_v}V`,
    
    // Liaison audit (optionnel)
    plantId: options.plantId,
    zoneId: options.zoneId,
    auditElToken: options.auditElToken
  };
  
  return testData;
}
