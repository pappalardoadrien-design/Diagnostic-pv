// Parser pour fichiers TXT PVServ (format pvserve.txt)

import type { IVCurveData, IVPoint } from '../types';

/**
 * Parse un fichier TXT PVServ (N mesures par fichier)
 * 
 * Format attendu (multi-blocs) :
 * Standby
 * USER U-Limit 0 0,00
 * Nr. 1
 * FF 0,917
 * Rds 21,50
 * Uf 738
 * bright
 * U I
 * 208 0,00
 * ...
 * 
 * Nr. 1         ← Nouveau bloc (même string, nouvelle mesure)
 * FF 0,837
 * ...
 * 
 * Nr. 2         ← Nouveau string
 * FF 0,923
 * ...
 */
export function parsePVServTXT(content: string, filename: string): IVCurveData[] {
  // Nettoyer caractères spéciaux Windows (\r) et tabulations
  const cleanContent = content.replace(/\r/g, '');
  const lines = cleanContent.split('\n').map(l => l.trim()).filter(l => l);
  const curves: IVCurveData[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Détecter début de bloc : "Nr. X"
    if (line.startsWith('Nr.')) {
      const curve = parseTXTBlock(lines, i, filename);
      if (curve && curve.measurements.length > 0) {
        curves.push(curve);
      }
      
      // Avancer jusqu'au prochain bloc "Nr." ou fin
      i++;
      while (i < lines.length && !lines[i].startsWith('Nr.')) {
        i++;
      }
    } else {
      i++;
    }
  }
  
  return curves;
}

/**
 * Parse un bloc TXT (1 mesure)
 */
function parseTXTBlock(lines: string[], startIndex: number, filename: string): IVCurveData | null {
  const curve: IVCurveData = {
    stringNumber: 1,
    curveType: 'dark',
    measurements: [],
    sourceFilename: filename
  };

  let parsingMode: 'metadata' | 'measurements' = 'metadata';
  let i = startIndex;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Stop si nouveau bloc commence (sauf si on est au startIndex)
    if (i > startIndex && line.startsWith('Nr.')) {
      break;
    }
    
    if (parsingMode === 'metadata') {
      // String number
      if (line.startsWith('Nr.')) {
        const match = line.match(/Nr\.\s+(\d+)/);
        if (match) curve.stringNumber = parseInt(match[1]);
        i++;
        continue;
      }
      
      // FF (Fill Factor)
      if (line.startsWith('FF')) {
        const parts = line.split(/[\s\t]+/);
        if (parts.length >= 2) {
          const ffValue = parts[1].replace(',', '.');
          curve.fillFactor = parseFloat(ffValue);
        }
        i++;
        continue;
      }
      
      // Rds (resistance dynamique serie)
      if (line.startsWith('Rds')) {
        const parts = line.split(/[\s\t]+/);
        if (parts.length >= 2) {
          const rdsValue = parts[1].replace(',', '.');
          curve.rds = parseFloat(rdsValue);
        }
        i++;
        continue;
      }
      
      // Uf (diodes defectueuses)
      if (line.startsWith('Uf')) {
        const parts = line.split(/[\s\t]+/);
        if (parts.length >= 2) {
          curve.ufDiodes = parseInt(parts[1]);
        }
        i++;
        continue;
      }
      
      // Type courbe (dark/bright)
      const lineLower = line.toLowerCase();
      if (lineLower === 'dark' || lineLower === 'bright') {
        curve.curveType = lineLower as 'dark' | 'bright';
        i++;
        continue;
      }
      
      // Header colonnes U I (avec tabulation possible)
      if (line.match(/^U[\s\t]+I$/i)) {
        parsingMode = 'measurements';
        i++;
        continue;
      }
      
      i++;
    }
    
    if (parsingMode === 'measurements') {
      // Parse points (U, I)
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const voltage = parseFloat(parts[0].replace(',', '.'));
        const current = parseFloat(parts[1].replace(',', '.'));
        
        if (!isNaN(voltage) && !isNaN(current)) {
          curve.measurements.push({ voltage, current });
          i++;
        } else {
          // Fin des mesures (ligne non numérique)
          break;
        }
      } else {
        // Fin des mesures
        break;
      }
    }
  }
  
  return curve.measurements.length > 0 ? curve : null;
}

/**
 * Validation du format TXT
 */
export function isValidPVServTXT(content: string): boolean {
  const lines = content.split('\n');
  
  // Doit contenir au minimum FF, Uf, et header U I
  const hasFF = lines.some(l => l.trim().startsWith('FF'));
  const hasUf = lines.some(l => l.trim().startsWith('Uf'));
  const hasHeader = lines.some(l => l.trim().match(/^U\s+I$/));
  
  return hasFF && hasUf && hasHeader;
}
