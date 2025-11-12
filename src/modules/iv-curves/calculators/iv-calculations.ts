// Calculateurs de parametres electriques pour courbes I-V

import type { IVPoint, IVCurveData } from '../types';

/**
 * Calcule tous les parametres electriques depuis les points (U, I)
 */
export function calculateIVParameters(measurements: IVPoint[]): IVCurveData['calculated'] {
  if (!measurements || measurements.length === 0) {
    throw new Error('Pas de points de mesure pour calculer les parametres');
  }

  // 1. Calculer puissance pour chaque point P = U x I
  const withPower = measurements.map(m => ({
    ...m,
    power: Math.abs(m.voltage * m.current)
  }));

  // 2. Trouver Isc (courant court-circuit) : current max absolu
  // Pour courbes haute tension (strings), Isc = courant maximum mesuré
  const iscPoint = withPower.reduce((max, p) => 
    Math.abs(p.current) > Math.abs(max.current) ? p : max
  , withPower[0]);
  const isc = Math.abs(iscPoint.current);

  // 3. Trouver Voc (tension circuit ouvert) : voltage max quand current ~ 0
  const vocPoint = withPower.reduce((max, p) => 
    Math.abs(p.current) < 0.1 && Math.abs(p.voltage) > Math.abs(max.voltage) ? p : max
  , withPower[0]);
  const voc = Math.abs(vocPoint.voltage);

  // 4. Trouver Pmax et point MPP (Maximum Power Point)
  const pmaxPoint = withPower.reduce((max, p) => 
    (p.power || 0) > (max.power || 0) ? p : max
  , withPower[0]);
  const pmax = pmaxPoint.power || 0;
  const vmpp = Math.abs(pmaxPoint.voltage);
  const impp = Math.abs(pmaxPoint.current);

  // 5. Calculer Rs (resistance serie) : pente dans zone haute tension
  // Rs = -dV/dI dans la region proche de Voc
  const rs = calculateSeriesResistance(withPower, voc);

  // 6. Calculer Rsh (resistance shunt) : pente dans zone basse tension
  // Rsh = -dV/dI dans la region proche de Isc
  const rsh = calculateShuntResistance(withPower, isc);

  return {
    isc: parseFloat(isc.toFixed(3)),
    voc: parseFloat(voc.toFixed(2)),
    pmax: parseFloat(pmax.toFixed(2)),
    vmpp: parseFloat(vmpp.toFixed(2)),
    impp: parseFloat(impp.toFixed(3)),
    rs: !isFinite(rs) ? null : parseFloat(rs.toFixed(3)),
    rsh: !isFinite(rsh) ? null : parseFloat(rsh.toFixed(2))
  };
}

/**
 * Calcule resistance serie Rs (Ohm)
 * Rs = -dV/dI dans la region proche de Voc (haute tension, faible courant)
 */
function calculateSeriesResistance(points: IVPoint[], voc: number): number {
  // Filtrer points dans region haute tension (V > 0.8*Voc)
  const highVoltagePoints = points
    .filter(p => Math.abs(p.voltage) > 0.8 * voc)
    .sort((a, b) => Math.abs(b.voltage) - Math.abs(a.voltage));

  if (highVoltagePoints.length < 2) {
    return 0;
  }

  // Calculer pente moyenne entre premiers points
  const dv = Math.abs(highVoltagePoints[0].voltage - highVoltagePoints[1].voltage);
  const di = Math.abs(highVoltagePoints[0].current - highVoltagePoints[1].current);

  return di === 0 ? 0 : Math.abs(dv / di);
}

/**
 * Calcule resistance shunt Rsh (Ohm)
 * Rsh = -dV/dI dans la region proche de Isc (basse tension, fort courant)
 */
function calculateShuntResistance(points: IVPoint[], isc: number): number {
  // Filtrer points dans region haute courant (I > 0.8*Isc)
  const highCurrentPoints = points
    .filter(p => Math.abs(p.current) > 0.8 * isc)
    .sort((a, b) => Math.abs(b.current) - Math.abs(a.current));

  if (highCurrentPoints.length < 2) {
    return Infinity;
  }

  // Calculer pente moyenne
  const dv = Math.abs(highCurrentPoints[0].voltage - highCurrentPoints[1].voltage);
  const di = Math.abs(highCurrentPoints[0].current - highCurrentPoints[1].current);

  return di === 0 ? Infinity : Math.abs(dv / di);
}

/**
 * Detecte anomalies sur courbe I-V
 */
export function detectAnomalies(curve: IVCurveData): IVCurveData['anomalies'] {
  const anomalies: string[] = [];
  let severity: 'ok' | 'warning' | 'critical' = 'ok';

  // 1. Fill Factor faible (< 0.7 = warning, < 0.5 = critical)
  if (curve.fillFactor !== undefined) {
    if (curve.fillFactor < 0.5) {
      anomalies.push('low_ff_critical');
      severity = 'critical';
    } else if (curve.fillFactor < 0.7) {
      anomalies.push('low_ff_warning');
      if (severity !== 'critical') severity = 'warning';
    }
  }

  // 2. Diodes bypass defectueuses
  // Pour strings complets, Uf > 100 est normal (tension seuil)
  // Anomalie si Uf est faible (< 10) car cela indique des diodes court-circuitées
  if (curve.ufDiodes !== undefined && curve.ufDiodes !== null) {
    if (curve.ufDiodes > 0 && curve.ufDiodes < 10) {
      anomalies.push('diode_failure');
      severity = 'critical';
    }
  }

  // 3. Resistance serie elevee
  // Note : Rs peut être null si calcul impossible
  // Seuils adaptatifs : module (Rs > 5Ω) vs string (Rs > 50Ω)
  if (curve.calculated?.rs !== undefined && curve.calculated?.rs !== null) {
    const rsThreshold = (curve.calculated.voc || 0) > 100 ? 50 : 5; // String si Voc > 100V
    if (curve.calculated.rs > rsThreshold) {
      anomalies.push('high_rs');
      if (severity !== 'critical') severity = 'warning';
    }
  }

  // 4. Resistance shunt faible
  // Note : Rsh peut être null si calcul impossible
  // Seuils adaptatifs : module (Rsh < 100Ω) vs string (Rsh < 10Ω)
  if (curve.calculated?.rsh !== undefined && curve.calculated?.rsh !== null) {
    const rshThreshold = (curve.calculated.voc || 0) > 100 ? 10 : 100; // String si Voc > 100V
    if (curve.calculated.rsh < rshThreshold) {
      anomalies.push('low_rsh');
      if (severity !== 'critical') severity = 'warning';
    }
  }

  return {
    detected: anomalies.length > 0,
    types: anomalies,
    severity
  };
}
