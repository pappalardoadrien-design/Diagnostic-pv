// DiagPV - Parser PVserv pour mesures électriques
// Format analysé: LAB/HP 31500/Mod 6298 S.Nr.: 23.44.1286 Nr. 1 FF 0,957 Rds 17,20 Uf 772 bright U I 212 0,00 339 0,00

export class PVservParser {
    constructor() {
        this.measurements = []
    }

    /**
     * Parse un fichier PVserv complet
     * @param {string} content - Contenu du fichier .txt
     * @returns {object} - Résultats parsés
     */
    parseFile(content) {
        const lines = content.split('\n').filter(line => line.trim())
        this.measurements = []
        
        const results = {
            success: true,
            measurements: [],
            errors: [],
            summary: {
                totalMeasurements: 0,
                brightMeasurements: 0,
                darkMeasurements: 0,
                cellBreaks: 0,
                validFF: 0,
                averageFF: 0
            }
        }

        console.log('🔍 Parsing PVserv file:', lines.length, 'lines')

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            
            try {
                const measurement = this.parseLine(line, i + 1)
                if (measurement) {
                    results.measurements.push(measurement)
                    this.measurements.push(measurement)
                }
            } catch (error) {
                results.errors.push({
                    line: i + 1,
                    content: line,
                    error: error.message
                })
            }
        }

        // Calcul statistiques
        this.calculateSummary(results)

        console.log('✅ PVserv parsing completed:', results.summary)
        return results
    }

    /**
     * Parse une ligne PVserv individuelle
     * @param {string} line - Ligne à parser
     * @param {number} lineNumber - Numéro de ligne
     * @returns {object|null} - Mesure parsée ou null
     */
    parseLine(line, lineNumber) {
        if (!line || line.length < 20) {
            return null // Ligne vide ou trop courte
        }

        // Patterns de reconnaissance PVserv
        const patterns = {
            // Pattern principal: LAB/HP 31500/Mod 6298 S.Nr.: 23.44.1286 Nr. 1 FF 0,957 Rds 17,20 Uf 772 bright U I 212 0,00 339 0,00
            main: /LAB\/HP\s+(\d+)\/Mod\s+(\d+)\s+S\.Nr\.\:\s+([\d\.]+)\s+Nr\.\s+(\d+)\s+FF\s+([\d\,\.]+)\s+Rds\s+([\d\,\.]+)\s+Uf\s+(\d+)\s+(bright|dark)\s+(.+)/i,
            
            // Pattern alternatif sans LAB/HP
            alt1: /S\.Nr\.\:\s+([\d\.]+)\s+Nr\.\s+(\d+)\s+FF\s+([\d\,\.]+)\s+Rds\s+([\d\,\.]+)\s+Uf\s+(\d+)\s+(bright|dark)\s+(.+)/i,
            
            // Pattern Cell break
            cellBreak: /Cell\s+break/i
        }

        // Détection Cell break
        if (patterns.cellBreak.test(line)) {
            return {
                type: 'cell_break',
                lineNumber,
                rawLine: line,
                description: 'Cell break detected',
                valid: false
            }
        }

        // Essai pattern principal
        let match = line.match(patterns.main)
        let patternUsed = 'main'
        
        if (!match) {
            // Essai pattern alternatif
            match = line.match(patterns.alt1)
            patternUsed = 'alt1'
        }

        if (!match) {
            throw new Error('Format PVserv non reconnu')
        }

        // Extraction données selon pattern
        let serialNumber, moduleNumber, ff, rds, uf, measurementType, ivData
        
        if (patternUsed === 'main') {
            [, , , serialNumber, moduleNumber, ff, rds, uf, measurementType, ivData] = match
        } else {
            [, serialNumber, moduleNumber, ff, rds, uf, measurementType, ivData] = match
        }

        // Conversion valeurs numériques
        const parsedFF = this.parseFloat(ff)
        const parsedRds = this.parseFloat(rds)
        const parsedUf = parseInt(uf)
        const parsedModuleNumber = parseInt(moduleNumber)

        // Parse courbe IV
        const ivCurve = this.parseIVCurve(ivData)

        const measurement = {
            type: 'measurement',
            lineNumber,
            rawLine: line,
            serialNumber,
            moduleNumber: parsedModuleNumber,
            ff: parsedFF,
            rds: parsedRds,
            uf: parsedUf,
            measurementType: measurementType.toLowerCase(),
            ivCurve,
            valid: this.validateMeasurement(parsedFF, parsedRds, parsedUf),
            timestamp: new Date().toISOString()
        }

        return measurement
    }

    /**
     * Parse courbe I-V
     * @param {string} ivData - Données brutes courbe IV
     * @returns {object} - Courbe IV parsée
     */
    parseIVCurve(ivData) {
        const points = []
        const parts = ivData.trim().split(/\s+/)
        
        // Parse par paires U I
        for (let i = 0; i < parts.length - 1; i += 2) {
            const voltage = this.parseFloat(parts[i])
            const current = this.parseFloat(parts[i + 1])
            
            if (!isNaN(voltage) && !isNaN(current)) {
                points.push({ U: voltage, I: current })
            }
        }

        return {
            points,
            count: points.length,
            maxVoltage: Math.max(...points.map(p => p.U)),
            maxCurrent: Math.max(...points.map(p => p.I))
        }
    }

    /**
     * Parse float avec gestion virgule/point
     * @param {string} value - Valeur à parser
     * @returns {number} - Valeur numérique
     */
    parseFloat(value) {
        if (!value) return NaN
        
        // Conversion virgule → point
        const normalized = value.toString().replace(',', '.')
        return parseFloat(normalized)
    }

    /**
     * Validation mesure
     * @param {number} ff - Fill Factor
     * @param {number} rds - Résistance série
     * @param {number} uf - Tension
     * @returns {boolean} - Mesure valide
     */
    validateMeasurement(ff, rds, uf) {
        // Plages de validation typiques PV
        const validFF = ff >= 0.1 && ff <= 1.0
        const validRds = rds >= 0.1 && rds <= 100.0
        const validUf = uf >= 100 && uf <= 1000
        
        return validFF && validRds && validUf
    }

    /**
     * Calcul statistiques résumé
     * @param {object} results - Résultats à enrichir
     */
    calculateSummary(results) {
        const measurements = results.measurements.filter(m => m.type === 'measurement')
        const validMeasurements = measurements.filter(m => m.valid)
        
        results.summary = {
            totalMeasurements: measurements.length,
            brightMeasurements: measurements.filter(m => m.measurementType === 'bright').length,
            darkMeasurements: measurements.filter(m => m.measurementType === 'dark').length,
            cellBreaks: results.measurements.filter(m => m.type === 'cell_break').length,
            validMeasurements: validMeasurements.length,
            validFF: validMeasurements.length,
            averageFF: validMeasurements.length > 0 
                ? (validMeasurements.reduce((sum, m) => sum + m.ff, 0) / validMeasurements.length).toFixed(3)
                : 0,
            averageRds: validMeasurements.length > 0
                ? (validMeasurements.reduce((sum, m) => sum + m.rds, 0) / validMeasurements.length).toFixed(2)
                : 0,
            averageUf: validMeasurements.length > 0
                ? Math.round(validMeasurements.reduce((sum, m) => sum + m.uf, 0) / validMeasurements.length)
                : 0
        }
    }

    /**
     * Génère rapport mesures pour intégration audit
     * @param {array} measurements - Mesures parsées
     * @returns {string} - Rapport HTML
     */
    generateMeasurementsReport(measurements) {
        if (!measurements || measurements.length === 0) {
            return '<p>Aucune mesure PVserv disponible</p>'
        }

        const validMeasurements = measurements.filter(m => m.type === 'measurement' && m.valid)
        const cellBreaks = measurements.filter(m => m.type === 'cell_break')

        let html = `
            <div class="pvserv-measurements">
                <h3>MESURES ÉLECTRIQUES PVSERV</h3>
                
                <div class="measurements-summary">
                    <p><strong>Total mesures:</strong> ${measurements.length}</p>
                    <p><strong>Mesures valides:</strong> ${validMeasurements.length}</p>
                    <p><strong>Cell breaks:</strong> ${cellBreaks.length}</p>
                    ${validMeasurements.length > 0 ? `
                        <p><strong>FF moyen:</strong> ${(validMeasurements.reduce((sum, m) => sum + m.ff, 0) / validMeasurements.length).toFixed(3)}</p>
                        <p><strong>Rds moyen:</strong> ${(validMeasurements.reduce((sum, m) => sum + m.rds, 0) / validMeasurements.length).toFixed(2)} Ω</p>
                    ` : ''}
                </div>

                <table class="measurements-table" style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="border: 1px solid #d1d5db; padding: 8px;">Module</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px;">Type</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px;">FF</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px;">Rds (Ω)</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px;">Uf (V)</th>
                            <th style="border: 1px solid #d1d5db; padding: 8px;">Points IV</th>
                        </tr>
                    </thead>
                    <tbody>
        `

        validMeasurements.forEach(m => {
            html += `
                <tr>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">M${m.moduleNumber.toString().padStart(3, '0')}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${m.measurementType}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${m.ff.toFixed(3)}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${m.rds.toFixed(2)}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${m.uf}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${m.ivCurve.count}</td>
                </tr>
            `
        })

        // Cell breaks
        cellBreaks.forEach(cb => {
            html += `
                <tr style="background: #fee2e2;">
                    <td style="border: 1px solid #d1d5db; padding: 8px;" colspan="6">
                        <strong>CELL BREAK DÉTECTÉ</strong> - Ligne ${cb.lineNumber}
                    </td>
                </tr>
            `
        })

        html += `
                    </tbody>
                </table>
                
                <div class="measurements-note" style="margin-top: 15px; font-size: 12px; color: #6b7280;">
                    <p><strong>Note:</strong> Données PVserv brutes sans interprétation DiagPV.</p>
                    <p>FF = Fill Factor, Rds = Résistance série, Uf = Tension, Points IV = Nombre de points courbe I-V</p>
                </div>
            </div>
        `

        return html
    }

    /**
     * Export données pour base D1
     * @param {array} measurements - Mesures parsées
     * @param {string} auditToken - Token audit
     * @returns {array} - Données formatées pour insertion DB
     */
    formatForDatabase(measurements, auditToken) {
        const validMeasurements = measurements.filter(m => m.type === 'measurement')
        
        return validMeasurements.map(m => ({
            audit_token: auditToken,
            string_number: this.inferStringFromModule(m.moduleNumber),
            module_number: m.moduleNumber,
            ff: m.ff,
            rds: m.rds,
            uf: m.uf,
            measurement_type: m.measurementType,
            iv_curve_data: JSON.stringify(m.ivCurve),
            raw_line: m.rawLine,
            line_number: m.lineNumber,
            valid: m.valid,
            created_at: new Date().toISOString()
        }))
    }

    /**
     * Inférence numéro string depuis numéro module
     * @param {number} moduleNumber - Numéro module
     * @returns {number} - Numéro string estimé
     */
    inferStringFromModule(moduleNumber) {
        // Logique simple: modules 1-20 = string 1, 21-40 = string 2, etc.
        return Math.ceil(moduleNumber / 20)
    }

    /**
     * Validation format fichier PVserv
     * @param {string} content - Contenu fichier
     * @returns {object} - Validation
     */
    static validateFile(content) {
        if (!content || content.trim().length === 0) {
            return { valid: false, error: 'Fichier vide' }
        }

        const lines = content.split('\n').filter(l => l.trim())
        
        if (lines.length === 0) {
            return { valid: false, error: 'Aucune ligne de données' }
        }

        // Vérification présence patterns PVserv
        const hasValidPattern = lines.some(line => {
            return /FF\s+[\d\,\.]+\s+Rds\s+[\d\,\.]+\s+Uf\s+\d+\s+(bright|dark)/i.test(line) ||
                   /Cell\s+break/i.test(line)
        })

        if (!hasValidPattern) {
            return { valid: false, error: 'Format PVserv non détecté' }
        }

        return { valid: true, lines: lines.length }
    }
}