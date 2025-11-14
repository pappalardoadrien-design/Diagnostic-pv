/**
 * Template HTML - Rapport Flexible DiagPV
 * S'adapte aux modules sélectionnés selon le type d'audit
 */

import type { CustomReportData } from './types.js';

/**
 * Génère HTML du rapport personnalisé selon template
 */
export function generateCustomReportHTML(data: CustomReportData): string {
  const date = new Date(data.audit_date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const modulesData = data.modules_data;
  const hasEL = !!modulesData.el;
  const hasVisual = !!modulesData.visual;
  const hasIV = !!modulesData.iv_curves;
  const hasIsolation = !!modulesData.isolation;
  const hasThermal = !!modulesData.thermal;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.report_title} - ${data.plant_name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        @media print {
            body { margin: 0; padding: 15px; }
            .page-break { page-break-after: always; }
            .no-print { display: none; }
        }
        
        .diagpv-header {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
        }
        
        .module-section {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin: 1.5rem 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .conformity-bar {
            height: 30px;
            background: linear-gradient(90deg, #ef4444 0%, #eab308 50%, #22c55e 100%);
            border-radius: 15px;
            position: relative;
        }
        
        .conformity-indicator {
            position: absolute;
            top: -5px;
            width: 40px;
            height: 40px;
            background: white;
            border: 3px solid #1f2937;
            border-radius: 50%;
            transform: translateX(-50%);
        }
    </style>
</head>
<body class="bg-gray-50">
    
    <!-- BOUTONS ACTIONS -->
    <div class="no-print fixed top-4 right-4 z-50">
        <button onclick="window.print()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg">
            <i class="fas fa-print mr-2"></i>IMPRIMER PDF
        </button>
    </div>
    
    <div class="max-w-5xl mx-auto p-6">
        
        <!-- PAGE DE GARDE -->
        <div class="page-break">
            <div class="diagpv-header text-center mb-8">
                <div class="text-6xl font-black mb-2">DIAGNOSTIC PHOTOVOLTAÏQUE</div>
                <div class="text-2xl font-bold mb-4">${data.template.display_name}</div>
                <div class="text-xl opacity-90">${data.plant_name}</div>
            </div>
            
            <div class="bg-white rounded-lg p-8 shadow-lg">
                <div class="grid grid-cols-2 gap-6 mb-8">
                    <div>
                        <div class="text-gray-600 text-sm">CLIENT</div>
                        <div class="text-2xl font-bold">${data.client_name}</div>
                    </div>
                    <div>
                        <div class="text-gray-600 text-sm">DATE D'AUDIT</div>
                        <div class="text-2xl font-bold">${date}</div>
                    </div>
                    <div>
                        <div class="text-gray-600 text-sm">AUDITEUR</div>
                        <div class="text-xl font-semibold">${data.auditor_name}</div>
                    </div>
                    <div>
                        <div class="text-gray-600 text-sm">TYPE DE RAPPORT</div>
                        <div class="text-xl font-semibold flex items-center">
                            <i class="${data.template.icon} mr-2 text-green-600"></i>
                            ${data.template.display_name}
                        </div>
                    </div>
                </div>
                
                <div class="border-t pt-6">
                    <div class="text-gray-600 text-sm mb-2">MODULES ANALYSÉS</div>
                    <div class="flex flex-wrap gap-2">
                        ${hasEL ? '<span class="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-semibold"><i class="fas fa-bolt mr-1"></i>Électroluminescence</span>' : ''}
                        ${hasThermal ? '<span class="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-semibold"><i class="fas fa-thermometer-half mr-1"></i>Thermographie</span>' : ''}
                        ${hasIV ? '<span class="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold"><i class="fas fa-chart-line mr-1"></i>Courbes I-V</span>' : ''}
                        ${hasVisual ? '<span class="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold"><i class="fas fa-eye mr-1"></i>Inspection Visuelle</span>' : ''}
                        ${hasIsolation ? '<span class="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-semibold"><i class="fas fa-shield-alt mr-1"></i>Tests Isolation</span>' : ''}
                    </div>
                </div>
            </div>
            
            <!-- DiagPV Footer -->
            <div class="mt-12 text-center text-gray-600">
                <div class="font-bold text-lg text-green-700">DIAGNOSTIC PHOTOVOLTAÏQUE</div>
                <div class="text-sm">3 rue d'Apollo, 31240 L'Union | 05.81.10.16.59 | contact@diagpv.fr</div>
                <div class="text-xs">RCS 792972309 | Expertise indépendante depuis 2012</div>
            </div>
        </div>
        
        <!-- RÉSUMÉ EXÉCUTIF -->
        <div class="page-break">
            <div class="module-section">
                <h1 class="text-3xl font-black text-gray-900 mb-6 flex items-center">
                    <i class="fas fa-clipboard-check mr-3 text-green-600"></i>
                    RÉSUMÉ EXÉCUTIF
                </h1>
                
                <!-- Conformité Globale -->
                <div class="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-xl mb-6">
                    <div class="text-center mb-4">
                        <div class="text-gray-700 text-lg font-semibold mb-2">TAUX DE CONFORMITÉ GLOBAL</div>
                        <div class="text-7xl font-black ${data.overall_conformity_rate >= 85 ? 'text-green-600' : data.overall_conformity_rate >= 70 ? 'text-yellow-600' : 'text-red-600'}">
                            ${data.overall_conformity_rate.toFixed(1)}%
                        </div>
                    </div>
                    <div class="conformity-bar">
                        <div class="conformity-indicator" style="left: ${data.overall_conformity_rate}%"></div>
                    </div>
                    <div class="flex justify-between text-xs mt-2 text-gray-600">
                        <span>0% Non Conforme</span>
                        <span>50% Acceptable</span>
                        <span>100% Excellent</span>
                    </div>
                </div>
                
                <!-- Statistiques Problèmes -->
                <div class="grid grid-cols-3 gap-4 mb-6">
                    <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div class="text-red-700 text-3xl font-black">${data.critical_issues_count}</div>
                        <div class="text-red-600 font-semibold">Problèmes Critiques</div>
                    </div>
                    <div class="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                        <div class="text-orange-700 text-3xl font-black">${data.major_issues_count}</div>
                        <div class="text-orange-600 font-semibold">Problèmes Majeurs</div>
                    </div>
                    <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                        <div class="text-yellow-700 text-3xl font-black">${data.minor_issues_count}</div>
                        <div class="text-yellow-600 font-semibold">Problèmes Mineurs</div>
                    </div>
                </div>
                
                <!-- Conformité par Module -->
                <div class="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h3 class="text-xl font-bold mb-4">Conformité par Module</h3>
                    <canvas id="conformityChart" class="w-full" style="max-height: 300px;"></canvas>
                </div>
            </div>
        </div>
        
        <!-- SECTIONS PAR MODULE -->
        ${hasEL ? generateELSection(modulesData.el!) : ''}
        ${hasVisual ? generateVisualSection(modulesData.visual!) : ''}
        ${hasIV ? generateIVSection(modulesData.iv_curves!) : ''}
        ${hasIsolation ? generateIsolationSection(modulesData.isolation!) : ''}
        ${hasThermal ? generateThermalSection(modulesData.thermal!) : ''}
        
        <!-- RECOMMANDATIONS -->
        <div class="page-break">
            <div class="module-section">
                <h1 class="text-3xl font-black text-gray-900 mb-6 flex items-center">
                    <i class="fas fa-lightbulb mr-3 text-yellow-500"></i>
                    RECOMMANDATIONS
                </h1>
                
                <div class="space-y-4">
                    ${generateRecommendations(data)}
                </div>
            </div>
        </div>
        
        <!-- SIGNATURES -->
        <div class="module-section">
            <h2 class="text-2xl font-bold mb-6">Signatures et Validation</h2>
            <div class="grid grid-cols-2 gap-8">
                <div class="border-2 border-gray-300 rounded-lg p-6">
                    <div class="text-gray-600 text-sm mb-2">AUDITEUR TERRAIN</div>
                    <div class="text-xl font-bold mb-4">${data.auditor_name}</div>
                    <div class="text-sm text-gray-600">Date: ${date}</div>
                    <div class="mt-6 border-t-2 border-gray-400 pt-2 text-center text-sm text-gray-500">
                        Signature
                    </div>
                </div>
                <div class="border-2 border-gray-300 rounded-lg p-6">
                    <div class="text-gray-600 text-sm mb-2">VALIDATION TECHNIQUE</div>
                    <div class="text-xl font-bold mb-4">Fabien CORRERA</div>
                    <div class="text-sm text-gray-600">Directeur Technique DiagPV</div>
                    <div class="mt-6 border-t-2 border-gray-400 pt-2 text-center text-sm text-gray-500">
                        Signature
                    </div>
                </div>
            </div>
            
            <div class="mt-8 bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
                <div class="flex items-center justify-center mb-2">
                    <i class="fas fa-certificate text-green-600 text-3xl mr-3"></i>
                    <span class="text-2xl font-black text-green-700">RAPPORT CERTIFIÉ DIAGPV</span>
                </div>
                <div class="text-sm text-gray-600">
                    Ce rapport a été réalisé conformément aux normes IEC 62446-1 et aux standards DiagPV
                </div>
            </div>
        </div>
        
    </div>
    
    <script>
        // Graphique conformité par module
        const ctx = document.getElementById('conformityChart');
        if (ctx) {
            const moduleLabels = [];
            const moduleData = [];
            const moduleColors = [];
            
            ${hasEL ? `
            moduleLabels.push('EL (${data.conformity_weights.el ? (data.conformity_weights.el * 100).toFixed(0) : '0'}%)');
            moduleData.push(${modulesData.el?.conformity_rate || 0});
            moduleColors.push('rgba(147, 51, 234, 0.8)');
            ` : ''}
            
            ${hasVisual ? `
            moduleLabels.push('Visual (${data.conformity_weights.visual ? (data.conformity_weights.visual * 100).toFixed(0) : '0'}%)');
            moduleData.push(${modulesData.visual?.conformity_rate || 0});
            moduleColors.push('rgba(34, 197, 94, 0.8)');
            ` : ''}
            
            ${hasIV ? `
            moduleLabels.push('IV (${data.conformity_weights.iv_curves ? (data.conformity_weights.iv_curves * 100).toFixed(0) : '0'}%)');
            moduleData.push(${modulesData.iv_curves?.conformity_rate || 0});
            moduleColors.push('rgba(59, 130, 246, 0.8)');
            ` : ''}
            
            ${hasIsolation ? `
            moduleLabels.push('Isolation (${data.conformity_weights.isolation ? (data.conformity_weights.isolation * 100).toFixed(0) : '0'}%)');
            moduleData.push(${modulesData.isolation?.conformity_rate || 0});
            moduleColors.push('rgba(234, 179, 8, 0.8)');
            ` : ''}
            
            ${hasThermal ? `
            moduleLabels.push('Thermal (${data.conformity_weights.thermal ? (data.conformity_weights.thermal * 100).toFixed(0) : '0'}%)');
            moduleData.push(${modulesData.thermal?.conformity_rate || 0});
            moduleColors.push('rgba(239, 68, 68, 0.8)');
            ` : ''}
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: moduleLabels,
                    datasets: [{
                        label: 'Conformité (%)',
                        data: moduleData,
                        backgroundColor: moduleColors,
                        borderColor: moduleColors.map(c => c.replace('0.8', '1')),
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    </script>
</body>
</html>
`;
}

// Generate EL section
function generateELSection(data: any): string {
  return `
<div class="page-break">
    <div class="module-section">
        <h1 class="text-3xl font-black text-purple-900 mb-6 flex items-center">
            <i class="fas fa-bolt mr-3 text-purple-600"></i>
            ÉLECTROLUMINESCENCE
        </h1>
        
        <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Total Modules</div>
                <div class="text-3xl font-black">${data.total_modules}</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">OK</div>
                <div class="text-3xl font-black text-green-600">${data.ok_count}</div>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Défauts</div>
                <div class="text-3xl font-black text-red-600">${data.defects_count}</div>
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg border-2">
            <h3 class="text-xl font-bold mb-4">Répartition des Défauts</h3>
            <div class="space-y-2">
                <div class="flex justify-between items-center">
                    <span>Inégalités</span>
                    <span class="font-bold">${data.defect_stats.inequalities}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span>Microfissures</span>
                    <span class="font-bold">${data.defect_stats.microcracks}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span>Modules HS</span>
                    <span class="font-bold">${data.defect_stats.hs}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span>String Ouvert</span>
                    <span class="font-bold">${data.defect_stats.string_open}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span>Non Raccordé</span>
                    <span class="font-bold">${data.defect_stats.not_connected}</span>
                </div>
            </div>
        </div>
    </div>
</div>
`;
}

// Generate Visual section
function generateVisualSection(data: any): string {
  const criticalHTML = data.critical_issues.slice(0, 10).map((issue: any) => `
    <div class="flex justify-between items-start border-b pb-2">
        <div class="flex-1">
            <div class="font-semibold">${issue.category} - ${issue.item}</div>
            ${issue.remarks ? `<div class="text-sm text-gray-600">${issue.remarks}</div>` : ''}
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Non-Conforme</span>
    </div>
  `).join('');

  return `
<div class="page-break">
    <div class="module-section">
        <h1 class="text-3xl font-black text-green-900 mb-6 flex items-center">
            <i class="fas fa-eye mr-3 text-green-600"></i>
            INSPECTION VISUELLE IEC 62446-1
        </h1>
        
        <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Points Contrôlés</div>
                <div class="text-3xl font-black">${data.total_items}</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Conformes</div>
                <div class="text-3xl font-black text-green-600">${data.conform_count}</div>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Non-Conformes</div>
                <div class="text-3xl font-black text-red-600">${data.non_conform_count}</div>
            </div>
        </div>
        
        ${data.critical_issues.length > 0 ? `
        <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded">
            <h3 class="text-xl font-bold text-red-800 mb-4">⚠️ Points Non-Conformes Détectés</h3>
            <div class="space-y-3">
                ${criticalHTML}
            </div>
        </div>
        ` : '<div class="bg-green-50 p-6 rounded-lg text-center text-green-700 font-bold">✅ Aucun problème critique détecté</div>'}
    </div>
</div>
`;
}

// Generate IV section
function generateIVSection(data: any): string {
  return `
<div class="page-break">
    <div class="module-section">
        <h1 class="text-3xl font-black text-blue-900 mb-6 flex items-center">
            <i class="fas fa-chart-line mr-3 text-blue-600"></i>
            COURBES CARACTÉRISTIQUES I-V
        </h1>
        
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Courbes Mesurées</div>
                <div class="text-3xl font-black">${data.total_curves}</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">FF Moyen</div>
                <div class="text-3xl font-black text-blue-600">${data.avg_ff.toFixed(2)}</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">R_ds Moyen</div>
                <div class="text-3xl font-black text-purple-600">${data.avg_rds.toFixed(2)}</div>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Hors Tolérance</div>
                <div class="text-3xl font-black text-red-600">${data.out_of_tolerance_count}</div>
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg border-2">
            <h3 class="text-xl font-bold mb-4">Interprétation</h3>
            <ul class="space-y-2 text-gray-700">
                <li><strong>FF ${data.avg_ff >= 0.75 ? '✅' : '⚠️'}</strong>: ${data.avg_ff >= 0.75 ? 'Excellent' : data.avg_ff >= 0.70 ? 'Acceptable' : 'Problème détecté'}</li>
                <li><strong>R_ds ${data.avg_rds <= 1.05 ? '✅' : '⚠️'}</strong>: ${data.avg_rds <= 1.05 ? 'Excellent' : data.avg_rds <= 1.2 ? 'Acceptable' : 'Déséquilibres importants'}</li>
                <li><strong>Conformité</strong>: ${data.conformity_rate.toFixed(1)}% des modules respectent les seuils</li>
            </ul>
        </div>
    </div>
</div>
`;
}

// Generate Isolation section
function generateIsolationSection(data: any): string {
  return `
<div class="page-break">
    <div class="module-section">
        <h1 class="text-3xl font-black text-yellow-900 mb-6 flex items-center">
            <i class="fas fa-shield-alt mr-3 text-yellow-600"></i>
            TESTS D'ISOLEMENT
        </h1>
        
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Tests Effectués</div>
                <div class="text-3xl font-black">${data.total_tests}</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Conformes</div>
                <div class="text-3xl font-black text-green-600">${data.conform_count}</div>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">DC+ Terre (MΩ)</div>
                <div class="text-3xl font-black text-yellow-600">${data.avg_dc_positive_to_earth.toFixed(2)}</div>
            </div>
            <div class="bg-orange-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">DC- Terre (MΩ)</div>
                <div class="text-3xl font-black text-orange-600">${data.avg_dc_negative_to_earth.toFixed(2)}</div>
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg border-2">
            <h3 class="text-xl font-bold mb-4">Conformité NF C 15-100</h3>
            <div class="text-gray-700">
                <p class="mb-2"><strong>Seuil minimum requis</strong>: ≥ 1.0 MΩ (DC+/Terre et DC-/Terre)</p>
                <p class="mb-2"><strong>Résultat</strong>: ${data.conform_count === data.total_tests ? '✅ Tous les tests conformes' : `⚠️ ${data.non_conform_count} test(s) non conforme(s)`}</p>
                <p><strong>Dernier test</strong>: ${data.latest_test_date}</p>
            </div>
        </div>
    </div>
</div>
`;
}

// Generate Thermal section
function generateThermalSection(data: any): string {
  return `
<div class="page-break">
    <div class="module-section">
        <h1 class="text-3xl font-black text-red-900 mb-6 flex items-center">
            <i class="fas fa-thermometer-half mr-3 text-red-600"></i>
            THERMOGRAPHIE INFRAROUGE
        </h1>
        
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Modules Analysés</div>
                <div class="text-3xl font-black">${data.total_modules}</div>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Hotspots</div>
                <div class="text-3xl font-black text-red-600">${data.hotspot_count}</div>
            </div>
            <div class="bg-orange-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Diodes HS</div>
                <div class="text-3xl font-black text-orange-600">${data.bypass_diode_count}</div>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
                <div class="text-gray-600 text-sm">Temp Max (°C)</div>
                <div class="text-3xl font-black text-yellow-600">${data.thermal_stats.max_temp}</div>
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg border-2">
            <h3 class="text-xl font-bold mb-4">Analyse Thermique</h3>
            <ul class="space-y-2 text-gray-700">
                <li><strong>Température moyenne</strong>: ${data.thermal_stats.avg_temp}°C</li>
                <li><strong>Delta T maximum</strong>: ${data.thermal_stats.delta_temp}°C</li>
                <li><strong>Conformité</strong>: ${data.conformity_rate.toFixed(1)}%</li>
            </ul>
        </div>
    </div>
</div>
`;
}

// Generate recommendations based on data
function generateRecommendations(data: CustomReportData): string {
  const recommendations: string[] = [];
  
  // EL recommendations
  if (data.modules_data.el) {
    const el = data.modules_data.el;
    if (el.defects_count > 0) {
      if (el.defect_stats.hs > 0) {
        recommendations.push(`
          <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div class="font-bold text-red-700">URGENT - Modules Hors Service</div>
              <div class="text-gray-700">${el.defect_stats.hs} module(s) complètement défaillant(s) détecté(s). Remplacement impératif sous peine de pertes de production importantes.</div>
          </div>
        `);
      }
      if (el.defect_stats.microcracks > el.total_modules * 0.1) {
        recommendations.push(`
          <div class="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <div class="font-bold text-orange-700">IMPORTANT - Microfissures</div>
              <div class="text-gray-700">${el.defect_stats.microcracks} module(s) avec microfissures. Surveillance recommandée, risque de dégradation accélérée.</div>
          </div>
        `);
      }
    }
  }
  
  // Visual recommendations
  if (data.modules_data.visual && data.modules_data.visual.non_conform_count > 0) {
    recommendations.push(`
      <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <div class="font-bold text-yellow-700">ATTENTION - Non-Conformités Visuelles</div>
          <div class="text-gray-700">${data.modules_data.visual.non_conform_count} point(s) de contrôle non conforme(s) IEC 62446-1. Vérifier les détails dans la section Inspection Visuelle.</div>
      </div>
    `);
  }
  
  // IV recommendations
  if (data.modules_data.iv_curves && data.modules_data.iv_curves.out_of_tolerance_count > 0) {
    recommendations.push(`
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div class="font-bold text-blue-700">PERFORMANCE - Courbes I-V</div>
          <div class="text-gray-700">${data.modules_data.iv_curves.out_of_tolerance_count} courbe(s) hors tolérance (FF < 0.70 ou R_ds > 1.2). Vérifier connexions et équilibrage strings.</div>
      </div>
    `);
  }
  
  // Isolation recommendations
  if (data.modules_data.isolation && data.modules_data.isolation.non_conform_count > 0) {
    recommendations.push(`
      <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div class="font-bold text-red-700">SÉCURITÉ - Isolation Défaillante</div>
          <div class="text-gray-700">${data.modules_data.isolation.non_conform_count} test(s) d'isolement non conforme(s). Risque électrique, intervention urgente requise.</div>
      </div>
    `);
  }
  
  // Thermal recommendations
  if (data.modules_data.thermal) {
    const thermal = data.modules_data.thermal;
    if (thermal.hotspot_count > 0 || thermal.bypass_diode_count > 0) {
      recommendations.push(`
        <div class="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <div class="font-bold text-orange-700">THERMIQUE - Anomalies Détectées</div>
            <div class="text-gray-700">${thermal.hotspot_count} hotspot(s) et ${thermal.bypass_diode_count} diode(s) bypass défaillante(s). Risque incendie potentiel, surveillance nécessaire.</div>
        </div>
      `);
    }
  }
  
  // Global recommendation
  if (data.overall_conformity_rate < 85) {
    recommendations.push(`
      <div class="bg-gray-50 border-l-4 border-gray-500 p-4 rounded">
          <div class="font-bold text-gray-700">PLAN D'ACTION GLOBAL</div>
          <div class="text-gray-700">Conformité globale ${data.overall_conformity_rate.toFixed(1)}%. Recommandation de suivi régulier et plan de maintenance corrective sur ${data.critical_issues_count + data.major_issues_count} point(s) prioritaire(s).</div>
      </div>
    `);
  } else {
    recommendations.push(`
      <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div class="font-bold text-green-700">✅ INSTALLATION EN BON ÉTAT</div>
          <div class="text-gray-700">Conformité globale ${data.overall_conformity_rate.toFixed(1)}%. Maintenir les opérations de maintenance préventive régulières.</div>
      </div>
    `);
  }
  
  return recommendations.join('');
}
