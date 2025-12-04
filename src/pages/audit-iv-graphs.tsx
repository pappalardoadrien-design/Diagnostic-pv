// ============================================================================
// PAGE MODULE I-V - GRAPHIQUES COURBES I-V
// ============================================================================
// Visualisation courbes I-V de référence et sombres avec Chart.js
// Génération automatique de courbes synthétiques si données manquantes
// ============================================================================

export function getAuditIvGraphsPage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Graphiques I-V - Courbes de Référence & Sombres</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <!-- Navigation Modules -->
            <div id="module-nav" class="mb-6"></div>
            
            <!-- En-tête -->
            <header class="mb-8 text-center">
                <div class="inline-flex items-center mb-4">
                    <i class="fas fa-chart-area text-5xl text-orange-400 mr-4"></i>
                    <h1 class="text-4xl font-black">GRAPHIQUES I-V</h1>
                </div>
                <p class="text-xl text-gray-300">Courbes de Référence & Sombres - IEC 62446-1</p>
            </header>
            
            <!-- Sélecteur de module -->
            <div class="max-w-6xl mx-auto mb-8">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-orange-400">
                    <h2 class="text-2xl font-black mb-4">
                        <i class="fas fa-search mr-2 text-orange-400"></i>
                        SÉLECTIONNER UN MODULE
                    </h2>
                    
                    <div class="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block font-bold mb-2">String :</label>
                            <select id="selectString" class="w-full bg-black border-2 border-gray-600 rounded px-4 py-3 text-lg font-bold">
                                <option value="">-- Toutes les strings --</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold mb-2">Module :</label>
                            <select id="selectModule" class="w-full bg-black border-2 border-gray-600 rounded px-4 py-3 text-lg font-bold">
                                <option value="">-- Tous les modules --</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-4">
                        <div class="bg-gradient-to-br from-orange-900 to-orange-700 rounded-lg p-4 text-center">
                            <p class="text-3xl font-black" id="stat-total-modules">0</p>
                            <p class="text-orange-200">Modules Total</p>
                        </div>
                        <div class="bg-gradient-to-br from-green-900 to-green-700 rounded-lg p-4 text-center">
                            <p class="text-3xl font-black" id="stat-ref-curves">0</p>
                            <p class="text-green-200">Courbes Référence</p>
                        </div>
                        <div class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-4 text-center">
                            <p class="text-3xl font-black" id="stat-dark-curves">0</p>
                            <p class="text-blue-200">Courbes Sombres</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Graphique Courbe I-V Référence -->
            <div class="max-w-6xl mx-auto mb-8">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-green-400">
                    <h2 class="text-2xl font-black mb-4 text-green-400">
                        <i class="fas fa-sun mr-2"></i>
                        COURBE I-V RÉFÉRENCE
                    </h2>
                    <div class="bg-black rounded-lg p-4">
                        <canvas id="chartReference" height="400"></canvas>
                    </div>
                    <div id="refStats" class="mt-4 grid grid-cols-5 gap-2 text-center">
                        <!-- Stats will be populated here -->
                    </div>
                </div>
            </div>
            
            <!-- Graphique Courbe I-V Sombre -->
            <div class="max-w-6xl mx-auto mb-8">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-blue-400">
                    <h2 class="text-2xl font-black mb-4 text-blue-400">
                        <i class="fas fa-moon mr-2"></i>
                        COURBE I-V SOMBRE
                    </h2>
                    <div class="bg-black rounded-lg p-4">
                        <canvas id="chartDark" height="400"></canvas>
                    </div>
                    <div id="darkStats" class="mt-4 grid grid-cols-5 gap-2 text-center">
                        <!-- Stats will be populated here -->
                    </div>
                </div>
            </div>
            
            <!-- Comparaison Multi-Modules -->
            <div class="max-w-6xl mx-auto mb-8">
                <div class="bg-gray-900 rounded-lg p-6 border-2 border-purple-400">
                    <h2 class="text-2xl font-black mb-4 text-purple-400">
                        <i class="fas fa-chart-line mr-2"></i>
                        COMPARAISON MULTI-MODULES
                    </h2>
                    <div class="bg-black rounded-lg p-4">
                        <canvas id="chartComparison" height="300"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="max-w-6xl mx-auto">
                <div class="flex gap-4 justify-end">
                    <button onclick="exportGraphsPDF()" class="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-black">
                        <i class="fas fa-file-pdf mr-2"></i>
                        EXPORTER GRAPHIQUES PDF
                    </button>
                    <button onclick="exportDataCSV()" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-black">
                        <i class="fas fa-file-csv mr-2"></i>
                        EXPORTER DONNÉES CSV
                    </button>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/module-nav.js"></script>
        <script>
            const auditToken = window.location.pathname.split('/')[2]
            let allMeasurements = []
            let chartRef = null
            let chartDark = null
            let chartComp = null
            
            // Générer courbe I-V synthétique (Approximation modèle 1-diode)
            function generateSyntheticCurve(isc, voc, pmax, type = 'reference') {
                const points = []
                const nPoints = 100
                
                // Calculer Fill Factor
                const ff = pmax / (isc * voc)
                
                for (let i = 0; i <= nPoints; i++) {
                    const v = (voc * i) / nPoints
                    
                    // Modèle simplifié courbe I-V
                    const normalized = v / voc
                    const i = isc * (1 - Math.pow(normalized, 1 / ff))
                    
                    points.push({ voltage: v.toFixed(3), current: i.toFixed(3) })
                }
                
                return points
            }
            
            // Charger mesures
            async function loadMeasurements() {
                try {
                    const response = await axios.get(\`/api/iv/measurements/\${auditToken}\`)
                    allMeasurements = response.data.measurements || []
                    
                    // Stats globales
                    const refMeasures = allMeasurements.filter(m => m.measurement_type === 'reference')
                    const darkMeasures = allMeasurements.filter(m => m.measurement_type === 'dark')
                    
                    document.getElementById('stat-total-modules').textContent = refMeasures.length
                    document.getElementById('stat-ref-curves').textContent = refMeasures.length
                    document.getElementById('stat-dark-curves').textContent = darkMeasures.length
                    
                    // Populate selectors
                    const strings = [...new Set(refMeasures.map(m => m.string_number))].sort((a, b) => a - b)
                    const selectString = document.getElementById('selectString')
                    selectString.innerHTML = '<option value="">-- Toutes les strings --</option>' + 
                        strings.map(s => \`<option value="\${s}">String \${s}</option>\`).join('')
                    
                    // Load first module by default
                    if (refMeasures.length > 0) {
                        loadModuleGraphs(refMeasures[0].string_number, refMeasures[0].module_number)
                    }
                    
                } catch (error) {
                    console.error('Erreur chargement mesures:', error)
                }
            }
            
            // Charger graphiques d'un module
            async function loadModuleGraphs(stringNum, moduleNum) {
                const refMeasure = allMeasurements.find(m => 
                    m.measurement_type === 'reference' && 
                    m.string_number === stringNum && 
                    m.module_number === moduleNum
                )
                
                const darkMeasure = allMeasurements.find(m => 
                    m.measurement_type === 'dark' && 
                    m.string_number === stringNum && 
                    m.module_number === moduleNum
                )
                
                // Courbe Référence
                if (refMeasure) {
                    let curveData = []
                    try {
                        curveData = refMeasure.iv_curve_data ? JSON.parse(refMeasure.iv_curve_data) : []
                    } catch (e) {
                        console.warn('Erreur parsing courbe référence, génération synthétique')
                    }
                    
                    // Si pas de données, générer courbe synthétique
                    if (!curveData || curveData.length === 0) {
                        curveData = generateSyntheticCurve(refMeasure.isc, refMeasure.voc, refMeasure.pmax, 'reference')
                    }
                    
                    updateReferenceChart(curveData, refMeasure)
                }
                
                // Courbe Sombre
                if (darkMeasure) {
                    let curveData = []
                    try {
                        curveData = darkMeasure.iv_curve_data ? JSON.parse(darkMeasure.iv_curve_data) : []
                    } catch (e) {
                        console.warn('Erreur parsing courbe sombre, génération synthétique')
                    }
                    
                    // Si pas de données, générer courbe synthétique (résistances)
                    if (!curveData || curveData.length === 0 && darkMeasure.rs && darkMeasure.rsh) {
                        curveData = generateDarkCurve(darkMeasure.rs, darkMeasure.rsh)
                    }
                    
                    updateDarkChart(curveData, darkMeasure)
                }
            }
            
            // Générer courbe sombre à partir Rs/Rsh
            function generateDarkCurve(rs, rsh) {
                const points = []
                const maxVoltage = 30 // Volts
                const nPoints = 100
                
                for (let i = 0; i <= nPoints; i++) {
                    const v = (maxVoltage * i) / nPoints
                    // Modèle simplifié: I = V/Rsh + (V - I*Rs)/Rs
                    const i = v / (rs + rsh)
                    points.push({ voltage: v.toFixed(3), current: (i * 1000).toFixed(3) }) // mA
                }
                
                return points
            }
            
            // Mettre à jour graphique référence
            function updateReferenceChart(curveData, measure) {
                const ctx = document.getElementById('chartReference').getContext('2d')
                
                if (chartRef) chartRef.destroy()
                
                chartRef = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: curveData.map(p => parseFloat(p.voltage)),
                        datasets: [{
                            label: \`S\${measure.string_number}-\${measure.module_number} - Courbe Référence\`,
                            data: curveData.map(p => parseFloat(p.current)),
                            borderColor: 'rgb(34, 197, 94)',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { 
                                display: true,
                                labels: { color: '#fff', font: { size: 14, weight: 'bold' } }
                            },
                            title: {
                                display: true,
                                text: \`Isc=\${measure.isc?.toFixed(2)}A | Voc=\${measure.voc?.toFixed(2)}V | Pmax=\${measure.pmax?.toFixed(1)}W | FF=\${measure.fill_factor?.toFixed(3)}\`,
                                color: '#fff',
                                font: { size: 16, weight: 'bold' }
                            }
                        },
                        scales: {
                            x: { 
                                title: { display: true, text: 'Tension (V)', color: '#fff', font: { size: 14, weight: 'bold' } },
                                ticks: { color: '#fff' },
                                grid: { color: 'rgba(255,255,255,0.1)' }
                            },
                            y: { 
                                title: { display: true, text: 'Courant (A)', color: '#fff', font: { size: 14, weight: 'bold' } },
                                ticks: { color: '#fff' },
                                grid: { color: 'rgba(255,255,255,0.1)' }
                            }
                        }
                    }
                })
                
                // Stats
                document.getElementById('refStats').innerHTML = \`
                    <div class="bg-gray-800 rounded p-2">
                        <p class="text-green-400 text-sm">Isc</p>
                        <p class="font-bold">\${measure.isc?.toFixed(2)} A</p>
                    </div>
                    <div class="bg-gray-800 rounded p-2">
                        <p class="text-green-400 text-sm">Voc</p>
                        <p class="font-bold">\${measure.voc?.toFixed(2)} V</p>
                    </div>
                    <div class="bg-gray-800 rounded p-2">
                        <p class="text-green-400 text-sm">Pmax</p>
                        <p class="font-bold">\${measure.pmax?.toFixed(1)} W</p>
                    </div>
                    <div class="bg-gray-800 rounded p-2">
                        <p class="text-green-400 text-sm">FF</p>
                        <p class="font-bold">\${measure.fill_factor?.toFixed(3)}</p>
                    </div>
                    <div class="bg-gray-800 rounded p-2">
                        <p class="text-green-400 text-sm">Irradiance</p>
                        <p class="font-bold">\${measure.irradiance || '-'} W/m²</p>
                    </div>
                \`
            }
            
            // Mettre à jour graphique sombre
            function updateDarkChart(curveData, measure) {
                const ctx = document.getElementById('chartDark').getContext('2d')
                
                if (chartDark) chartDark.destroy()
                
                chartDark = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: curveData.map(p => parseFloat(p.voltage)),
                        datasets: [{
                            label: \`S\${measure.string_number}-\${measure.module_number} - Courbe Sombre\`,
                            data: curveData.map(p => parseFloat(p.current)),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { 
                                display: true,
                                labels: { color: '#fff', font: { size: 14, weight: 'bold' } }
                            },
                            title: {
                                display: true,
                                text: \`Rs=\${measure.rs?.toFixed(2) || '-'}Ω | Rsh=\${measure.rsh?.toFixed(0) || '-'}Ω\`,
                                color: '#fff',
                                font: { size: 16, weight: 'bold' }
                            }
                        },
                        scales: {
                            x: { 
                                title: { display: true, text: 'Tension (V)', color: '#fff', font: { size: 14, weight: 'bold' } },
                                ticks: { color: '#fff' },
                                grid: { color: 'rgba(255,255,255,0.1)' }
                            },
                            y: { 
                                title: { display: true, text: 'Courant (mA)', color: '#fff', font: { size: 14, weight: 'bold' } },
                                ticks: { color: '#fff' },
                                grid: { color: 'rgba(255,255,255,0.1)' }
                            }
                        }
                    }
                })
                
                // Stats
                document.getElementById('darkStats').innerHTML = \`
                    <div class="bg-gray-800 rounded p-2">
                        <p class="text-blue-400 text-sm">Rs (série)</p>
                        <p class="font-bold">\${measure.rs?.toFixed(2) || '-'} Ω</p>
                    </div>
                    <div class="bg-gray-800 rounded p-2">
                        <p class="text-blue-400 text-sm">Rsh (shunt)</p>
                        <p class="font-bold">\${measure.rsh?.toFixed(0) || '-'} Ω</p>
                    </div>
                    <div class="bg-gray-800 rounded p-2">
                        <p class="text-blue-400 text-sm">Type</p>
                        <p class="font-bold">Sombre</p>
                    </div>
                    <div class="bg-gray-800 rounded p-2">
                        <p class="text-blue-400 text-sm">Temp.</p>
                        <p class="font-bold">\${measure.temperature_module || '-'} °C</p>
                    </div>
                    <div class="bg-gray-800 rounded p-2">
                        <p class="text-blue-400 text-sm">Date</p>
                        <p class="font-bold">\${new Date(measure.measurement_date).toLocaleDateString()}</p>
                    </div>
                \`
            }
            
            // Sélecteurs
            document.getElementById('selectString').addEventListener('change', (e) => {
                const stringNum = parseInt(e.target.value)
                if (!stringNum) return
                
                const modules = allMeasurements
                    .filter(m => m.measurement_type === 'reference' && m.string_number === stringNum)
                    .map(m => m.module_number)
                    .sort((a, b) => a - b)
                
                const selectModule = document.getElementById('selectModule')
                selectModule.innerHTML = '<option value="">-- Sélectionner module --</option>' +
                    modules.map(m => \`<option value="\${m}">Module \${m}</option>\`).join('')
            })
            
            document.getElementById('selectModule').addEventListener('change', (e) => {
                const moduleNum = parseInt(e.target.value)
                const stringNum = parseInt(document.getElementById('selectString').value)
                
                if (stringNum && moduleNum) {
                    loadModuleGraphs(stringNum, moduleNum)
                }
            })
            
            // Export PDF
            function exportGraphsPDF() {
                window.open(\`/api/iv/graphs-pdf/\${auditToken}\`, '_blank')
            }
            
            // Export CSV
            function exportDataCSV() {
                window.open(\`/api/iv/export-csv/\${auditToken}\`, '_blank')
            }
            
            // Init
            loadModuleNavigation(auditToken, 'IV')
            loadMeasurements()
        </script>
    </body>
    </html>
  `
}
