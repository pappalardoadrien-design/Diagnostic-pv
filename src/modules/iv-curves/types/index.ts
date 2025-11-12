// Types TypeScript pour Module IV - Courbes I-V

export interface IVPoint {
  voltage: number;      // Tension (V)
  current: number;      // Courant (A)
  power?: number;       // Puissance calculee P = U x I (W)
}

export interface IVCurveData {
  // Identification
  stringNumber: number;
  curveType: 'dark' | 'bright';
  
  // Metadonnees appareil
  deviceName?: string;
  serialNumber?: string;
  measurementDate?: Date;
  
  // Parametres extraits du fichier
  fillFactor?: number;  // FF
  rds?: number;         // Resistance dynamique serie
  ufDiodes?: number;    // Nombre diodes defectueuses
  ur?: number;          // Tension inverse
  
  // Points de mesure (U, I)
  measurements: IVPoint[];
  
  // Parametres calcules
  calculated?: {
    isc: number;        // Courant court-circuit (A)
    voc: number;        // Tension circuit ouvert (V)
    pmax: number;       // Puissance maximale (W)
    vmpp: number;       // Tension au Pmax (V)
    impp: number;       // Courant au Pmax (A)
    rs: number;         // Resistance serie (Ohm)
    rsh: number;        // Resistance shunt (Ohm)
  };
  
  // Detection anomalies
  anomalies?: {
    detected: boolean;
    types: string[];    // 'low_ff', 'high_rs', 'diode_failure', etc.
    severity: 'ok' | 'warning' | 'critical';
  };
  
  // Source fichier
  sourceFilename?: string;
  notes?: string;
}

export interface ParsedIVFile {
  curves: IVCurveData[];
  fileType: 'txt' | 'xlsx';
  parseErrors?: string[];
}

export interface IVCurveDBRecord {
  id?: number;
  el_audit_id?: number;
  audit_token?: string;
  string_number: number;
  curve_type: 'dark' | 'bright';
  measurement_date?: string;
  technician_id?: number;
  device_name?: string;
  serial_number?: string;
  fill_factor?: number;
  rds?: number;
  uf_diodes?: number;
  ur?: number;
  isc?: number;
  voc?: number;
  pmax?: number;
  vmpp?: number;
  impp?: number;
  rs?: number;
  rsh?: number;
  status: 'pending' | 'analyzed' | 'ok' | 'warning' | 'critical';
  anomaly_detected: boolean;
  anomaly_type?: string;
  source_filename?: string;
  source_file_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IVMeasurementDBRecord {
  id?: number;
  iv_curve_id: number;
  voltage: number;
  current: number;
  power?: number;
  measurement_order: number;
  created_at?: string;
}
