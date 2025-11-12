// Parser pour fichiers Excel PVServ avec macros (format .xlsm)

import * as XLSX from 'xlsx';
import type { IVCurveData, IVPoint } from '../types';

/**
 * Parse un fichier Excel PVServ (N strings par fichier)
 * 
 * Structure RÉELLE identifiée :
 * - Sheet "konvertierte Kennlinien" : Blocs verticaux par string
 * - Format bloc :
 *   Nr. X
 *   RecordsetCount: 1
 *   ID: X
 *   FF: -0.422
 *   Rds: 0
 *   Uf: 2
 *   U    I
 *   1   -0.32
 *   1   -0.62
 *   ...
 */
export function parsePVServExcel(buffer: ArrayBuffer, filename: string): IVCurveData[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  
  // Sheet cible : "konvertierte Kennlinien"
  const sheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('konvertierte') || 
    name.toLowerCase().includes('kennlinien')
  );
  
  if (!sheetName) {
    throw new Error('Sheet "konvertierte Kennlinien" non trouvee dans le fichier Excel');
  }
  
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  
  const curves: IVCurveData[] = [];
  
  // Parser les blocs verticaux
  let i = 0;
  while (i < data.length) {
    const row = data[i];
    
    // Détecter début bloc : "Nr. X"
    if (row[0] && String(row[0]).startsWith('Nr.')) {
      const curve = parseExcelBlock(data, i, filename);
      if (curve && curve.measurements.length > 0) {
        curves.push(curve);
      }
      
      // Skip to next bloc (trouver prochain "Nr.")
      i++;
      while (i < data.length && !String(data[i][0]).startsWith('Nr.')) {
        i++;
      }
    } else {
      i++;
    }
  }
  
  return curves;
}

/**
 * Parse un bloc vertical Excel (1 string)
 */
function parseExcelBlock(data: any[][], startIndex: number, filename: string): IVCurveData | null {
  const curve: IVCurveData = {
    stringNumber: 1,
    curveType: 'dark',
    measurements: [],
    sourceFilename: filename
  };
  
  let i = startIndex;
  let parsingMode: 'metadata' | 'measurements' = 'metadata';
  
  while (i < data.length) {
    const row = data[i];
    const key = String(row[0]).trim();
    const value = row[1];
    
    // Stop si nouveau bloc commence
    if (i > startIndex && key.startsWith('Nr.')) {
      break;
    }
    
    if (parsingMode === 'metadata') {
      // ID (string number)
      if (key === 'ID') {
        curve.stringNumber = parseInt(value) || 1;
        i++;
        continue;
      }
      
      // FF (Fill Factor)
      if (key === 'FF') {
        curve.fillFactor = parseFloat(value);
        i++;
        continue;
      }
      
      // Rds
      if (key === 'Rds') {
        curve.rds = parseFloat(value);
        i++;
        continue;
      }
      
      // Uf (diodes)
      if (key === 'Uf') {
        curve.ufDiodes = parseInt(value) || 0;
        i++;
        continue;
      }
      
      // Ur
      if (key === 'Ur') {
        const urValue = parseFloat(value);
        if (!isNaN(urValue)) {
          curve.ur = urValue;
        }
        i++;
        continue;
      }
      
      // Header U I (début mesures)
      if (key === 'U' && row[1] === 'I') {
        parsingMode = 'measurements';
        i++;
        continue;
      }
      
      i++;
    }
    
    if (parsingMode === 'measurements') {
      // Parse points (U, I)
      const voltage = parseFloat(row[0]);
      const current = parseFloat(row[1]);
      
      if (!isNaN(voltage) && !isNaN(current)) {
        curve.measurements.push({ voltage, current });
        i++;
      } else {
        // Fin des mesures
        break;
      }
    }
  }
  
  return curve.measurements.length > 0 ? curve : null;
}

/**
 * Validation format Excel
 */
export function isValidPVServExcel(buffer: ArrayBuffer): boolean {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Doit contenir au moins un sheet avec "kennlinien"
    return workbook.SheetNames.some(name => 
      name.toLowerCase().includes('konvertierte') || 
      name.toLowerCase().includes('kennlinien')
    );
  } catch {
    return false;
  }
}
