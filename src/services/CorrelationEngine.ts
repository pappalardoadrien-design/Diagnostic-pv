
// SERVICE MOTEUR DE CORRELATION EXPERT
// Analyse croisée des données EL, IV, Thermique et Visuel

export interface DiagnosisResult {
  module_identifier: string
  final_diagnosis: string
  severity_score: number // 1-5
  confidence: number // 0-100%
  sources: {
    el?: string
    iv?: string
    thermal?: string
    visual?: string
  }
  recommendation: string
  rules_triggered: string[]
}

export class CorrelationEngine {
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  /**
   * Analyse complète d'un module par croisement de données
   */
  async analyzeModule(
    auditToken: string,
    stringNumber: number,
    moduleNumber: number
  ): Promise<DiagnosisResult> {
    const data = await this.getModuleData(auditToken, stringNumber, moduleNumber)
    return this.applyExpertRules(data, stringNumber, moduleNumber)
  }

  /**
   * Récupère toutes les données disponibles pour un module
   */
  async getModuleData(auditToken: string, stringNum: number, modNum: number) {
    const results = {
      el: null as any,
      iv: null as any,
      thermal: null as any,
      visual: null as any
    }

    // 1. Données EL (via string/pos ou module_identifier si standardisé)
    // Note: el_modules utilise string_number et position_in_string
    const elData = await this.db.prepare(`
      SELECT * FROM el_modules 
      WHERE audit_token = ? AND string_number = ? AND position_in_string = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(auditToken, stringNum, modNum).first()
    results.el = elData

    // 2. Données IV
    // Note: iv_measurements table supposée
    try {
        const ivData = await this.db.prepare(`
        SELECT * FROM iv_measurements 
        WHERE audit_token = ? AND string_number = ? AND module_number = ?
        ORDER BY created_at DESC LIMIT 1
        `).bind(auditToken, stringNum, modNum).first()
        results.iv = ivData
    } catch (e) {
        console.warn('IV table or data missing', e)
    }

    // 3. Données Thermiques
    try {
        const thermalData = await this.db.prepare(`
        SELECT * FROM thermal_measurements 
        WHERE intervention_id IN (SELECT intervention_id FROM audits WHERE audit_token = ?)
        AND string_number = ? AND module_number = ?
        ORDER BY created_at DESC LIMIT 1
        `).bind(auditToken, stringNum, modNum).first()
        results.thermal = thermalData
    } catch (e) {
        console.warn('Thermal table or data missing', e)
    }
    
    // 4. Données Visuelles
    try {
        const visualData = await this.db.prepare(`
        SELECT * FROM visual_inspections 
        WHERE audit_token = ? AND string_number = ? AND module_number = ?
        ORDER BY created_at DESC LIMIT 1
        `).bind(auditToken, stringNum, modNum).first()
        results.visual = visualData
    } catch (e) {
        console.warn('Visual table or data missing', e)
    }

    return results
  }

  /**
   * Applique les règles métier expertes
   */
  private applyExpertRules(data: any, stringNum: number, modNum: number): DiagnosisResult {
    const rulesTriggered: string[] = []
    let diagnosis = 'OK'
    let severity = 0
    let recommendation = 'Aucune action requise'
    let confidence = 100

    const el = data.el
    const iv = data.iv
    const thermal = data.thermal
    const visual = data.visual

    // --- REGLE 1: PID CONFIRMED (EL + IV) ---
    // Si EL montre PID et IV montre shunt/Voc faible
    if (el?.defect_type === 'pid' || el?.defect_type === 'potential_induced_degradation') {
        diagnosis = 'PID_SUSPECT'
        severity = 3
        recommendation = 'Surveiller degradation'
        rulesTriggered.push('EL_PID_DETECTED')

        if (iv && (iv.rsh < 500 || iv.voc_deviation > 5)) { // Seuils arbitraires pour l'exemple
            diagnosis = 'PID_CONFIRMED'
            severity = 5
            recommendation = 'Remplacement module et installation box anti-PID'
            confidence = 95
            rulesTriggered.push('IV_CONFIRMS_PID')
        }
    }

    // --- REGLE 2: BYPASS DIODE (Thermal + IV) ---
    if (thermal?.defect_type === 'bypass_diode' || thermal?.defect_type === 'hotspot') {
        if (diagnosis === 'OK') {
            diagnosis = 'HOTSPOT_THERMAL'
            severity = 3
            recommendation = 'Vérifier intégrité module'
            rulesTriggered.push('THERMAL_HOTSPOT')
        }

        if (iv && iv.voc_deviation > 25) { // Chute de tension d'un tiers (approx 33%)
             diagnosis = 'BYPASS_DIODE_OPEN'
             severity = 5
             recommendation = 'Remplacement module (Diode HS)'
             confidence = 98
             rulesTriggered.push('IV_VOLTAGE_DROP_CONFIRMS_DIODE')
        }
    }

    // --- REGLE 3: CELLULE CASSEE (EL + Visual) ---
    if (el?.defect_type === 'broken_cell' || el?.defect_type === 'dead_cell') {
        diagnosis = 'BROKEN_CELL'
        severity = 4
        recommendation = 'Remplacement préventif'
        rulesTriggered.push('EL_BROKEN_CELL')
        
        if (visual?.defect_type === 'impact' || visual?.defect_type === 'glass_breakage') {
            severity = 5
            recommendation = 'Remplacement immédiat (Risque arc électrique)'
            rulesTriggered.push('VISUAL_CONFIRMS_BREAKAGE')
        }
    }
    
    // --- Priorité aux défauts critiques ---
    if (severity < 5 && (el?.severity_level >= 3 || thermal?.severity_level >= 3)) {
        if (diagnosis === 'OK') diagnosis = 'DEFECT_DETECTED'
        severity = Math.max(severity, el?.severity_level || 0, thermal?.severity_level || 0)
    }

    return {
      module_identifier: `S${stringNum}-M${modNum}`,
      final_diagnosis: diagnosis,
      severity_score: severity,
      confidence,
      sources: {
        el: el?.defect_type,
        iv: iv?.defect_type || (iv ? 'measured' : undefined),
        thermal: thermal?.defect_type,
        visual: visual?.defect_type
      },
      recommendation,
      rules_triggered: rulesTriggered
    }
  }
}
