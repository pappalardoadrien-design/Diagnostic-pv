// Entry point pour parsers PVServ

import { parsePVServTXT, isValidPVServTXT } from './pvserv-txt-parser';
import { parsePVServExcel, isValidPVServExcel } from './pvserv-excel-parser';
import { calculateIVParameters, detectAnomalies } from '../calculators/iv-calculations';
import type { IVCurveData, ParsedIVFile } from '../types';

/**
 * Parse un fichier PVServ (TXT ou Excel) automatiquement
 */
export async function parsePVServFile(
  file: File | Buffer,
  filename: string
): Promise<ParsedIVFile> {
  const extension = filename.toLowerCase().split('.').pop();
  
  try {
    if (extension === 'txt') {
      return parseTXTFile(file, filename);
    } else if (extension === 'xlsm' || extension === 'xlsx') {
      return parseExcelFile(file, filename);
    } else {
      return {
        curves: [],
        fileType: 'txt',
        parseErrors: [`Extension non supportee : ${extension}`]
      };
    }
  } catch (error) {
    return {
      curves: [],
      fileType: extension === 'txt' ? 'txt' : 'xlsx',
      parseErrors: [error instanceof Error ? error.message : 'Erreur parsing']
    };
  }
}

/**
 * Parse fichier TXT
 */
async function parseTXTFile(file: File | Buffer, filename: string): Promise<ParsedIVFile> {
  const content = await readFileAsText(file);
  
  if (!isValidPVServTXT(content)) {
    return {
      curves: [],
      fileType: 'txt',
      parseErrors: ['Format TXT PVServ invalide']
    };
  }
  
  const rawCurves = parsePVServTXT(content, filename);
  
  // Calculs automatiques pour chaque courbe
  const processedCurves = rawCurves.map(curve => {
    if (curve.measurements.length > 0) {
      curve.calculated = calculateIVParameters(curve.measurements);
      curve.anomalies = detectAnomalies(curve);
    }
    return curve;
  });
  
  return {
    curves: processedCurves,
    fileType: 'txt'
  };
}

/**
 * Parse fichier Excel
 */
async function parseExcelFile(file: File | Buffer, filename: string): Promise<ParsedIVFile> {
  const buffer = await readFileAsArrayBuffer(file);
  
  if (!isValidPVServExcel(buffer)) {
    return {
      curves: [],
      fileType: 'xlsx',
      parseErrors: ['Format Excel PVServ invalide']
    };
  }
  
  const rawCurves = parsePVServExcel(buffer, filename);
  
  // Calculs automatiques pour chaque string
  const processedCurves = rawCurves.map(curve => {
    if (curve.measurements.length > 0) {
      curve.calculated = calculateIVParameters(curve.measurements);
      curve.anomalies = detectAnomalies(curve);
    }
    return curve;
  });
  
  return {
    curves: processedCurves,
    fileType: 'xlsx'
  };
}

/**
 * Helper : lire fichier comme texte (Cloudflare Workers)
 */
async function readFileAsText(file: File | Buffer): Promise<string> {
  if (Buffer.isBuffer(file)) {
    return file.toString('utf-8');
  }
  
  // Cloudflare Workers: File hérite de Blob
  return await file.text();
}

/**
 * Helper : lire fichier comme ArrayBuffer (Cloudflare Workers)
 */
async function readFileAsArrayBuffer(file: File | Buffer): Promise<ArrayBuffer> {
  if (Buffer.isBuffer(file)) {
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  }
  
  // Cloudflare Workers: File hérite de Blob
  return await file.arrayBuffer();
}

// Re-exports
export { parsePVServTXT, parsePVServExcel };
export { calculateIVParameters, detectAnomalies };
