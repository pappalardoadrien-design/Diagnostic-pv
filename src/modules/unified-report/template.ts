/**
 * Template HTML - Rapport Unifié DiagPV
 * Design professionnel avec Tailwind CSS
 */

import type { UnifiedReportData } from './types/index.js';

/**
 * Génère HTML complet du rapport unifié
 */
export function generateReportHTML(data: UnifiedReportData): string {
  const date = new Date(data.generatedAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Audit PV - ${data.plantName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
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
        
        .stat-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 8px;
            padding: 1.5rem;
            border-left: 4px solid;
        }
        
        .priority-urgent { border-left-color: #ef4444; }
        .priority-high { border-left-color: #f97316; }
        .priority-medium { border-left-color: #eab308; }
        .priority-low { border-left-color: #3b82f6; }
        
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
    
    <!-- BOUTONS ACTIONS (no-print) -->
    <div class="no-print fixed top-4 right-4 z-50 space-x-2">
        <button onclick="window.print()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg">
            <i class="fas fa-print mr-2"></i>IMPRIMER PDF
        </button>
        <button onclick="downloadPDF()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg">
            <i class="fas fa-download mr-2"></i>TÉLÉCHARGER
        </button>
    </div>
    
    <div class="max-w-5xl mx-auto p-6">
        
        <!-- ====================================================================
             PAGE 1 - PAGE DE GARDE
        ==================================================================== -->
        <div class="page-break">
            <div class="diagpv-header text-center mb-8">
                <div class="mb-4">
                    <div class="text-6xl font-black mb-2">DIAGNOSTIC PHOTOVOLTAÏQUE</div>
                    <div class="text-2xl opacity-90">www.diagnosticphotovoltaique.fr</div>
                </div>
                
                <div class="text-4xl font-bold my-8 py-4 border-y-2 border-white/30">
                    RAPPORT D'AUDIT UNIFIÉ
                </div>
                
                <div class="bg-white/10 backdrop-blur rounded-lg p-6 text-left mt-8">
                    <div class="grid grid-cols-2 gap-4 text-lg">
                        <div><strong>Client :</strong> ${data.clientName}</div>
                        <div><strong>Centrale :</strong> ${data.plantName}</div>
                        <div><strong>Localisation :</strong> ${data.location}</div>
                        <div><strong>Date rapport :</strong> ${date}</div>
                        ${data.generatedBy ? `<div class="col-span-2"><strong>Générée par :</strong> ${data.generatedBy}</div>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Conformité Globale -->
            <div class="module-section">
                <h2 class="text-3xl font-bold mb-6 text-gray-800">
                    <i class="fas fa-chart-pie text-green-600 mr-3"></i>
                    SYNTHÈSE GLOBALE
                </h2>
                
                <div class="mb-6">
                    <div class="text-lg font-bold mb-2">Conformité Globale</div>
                    <div class="conformity-bar">
                        <div class="conformity-indicator" style="left: ${data.summary.overallConformityRate}%"></div>
                    </div>
                    <div class="text-center mt-2 text-4xl font-black ${data.summary.overallConformityRate >= 80 ? 'text-green-600' : data.summary.overallConformityRate >= 60 ? 'text-yellow-600' : 'text-red-600'}">
                        ${data.summary.overallConformityRate}%
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-4 mt-6">
                    <div class="stat-card border-l-red-500">
                        <div class="text-4xl font-black text-red-600 mb-2">${data.summary.criticalIssuesCount}</div>
                        <div class="text-sm font-bold text-gray-700">Défauts Critiques</div>
                    </div>
                    <div class="stat-card border-l-yellow-500">
                        <div class="text-4xl font-black text-yellow-600 mb-2">${data.summary.majorIssuesCount}</div>
                        <div class="text-sm font-bold text-gray-700">Défauts Majeurs</div>
                    </div>
                    <div class="stat-card border-l-blue-500">
                        <div class="text-4xl font-black text-blue-600 mb-2">${data.summary.minorIssuesCount}</div>
                        <div class="text-sm font-bold text-gray-700">Défauts Mineurs</div>
                    </div>
                </div>
                
                ${data.summary.urgentActionsRequired ? `
                <div class="bg-red-50 border-2 border-red-500 rounded-lg p-4 mt-6">
                    <div class="flex items-center text-red-800 font-bold text-xl">
                        <i class="fas fa-exclamation-triangle text-3xl mr-3"></i>
                        ACTIONS URGENTES REQUISES
                    </div>
                    <p class="text-red-700 mt-2">Intervention immédiate recommandée pour défauts critiques identifiés.</p>
                </div>
                ` : ''}
                
                <!-- Graphique Conformité par Module -->
                <div class="mt-8">
                    <h3 class="text-xl font-bold mb-4 text-gray-800">Conformité par Module</h3>
                    <div class="bg-white p-4 rounded-lg" style="height: 300px;">
                        <canvas id="conformityChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ====================================================================
             MODULE EL - ÉLECTROLUMINESCENCE
        ==================================================================== -->
        ${data.elModule.hasData ? `
        <div class="page-break">
            <div class="module-section">
                <h2 class="text-3xl font-bold mb-6 text-gray-800 border-b-4 border-green-500 pb-3">
                    <i class="fas fa-moon text-green-600 mr-3"></i>
                    MODULE ÉLECTROLUMINESCENCE
                </h2>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div><strong>Token Audit :</strong> ${data.elModule.auditToken}</div>
                    <div><strong>Date Audit :</strong> ${new Date(data.elModule.auditDate).toLocaleDateString('fr-FR')}</div>
                    <div><strong>Total Modules :</strong> ${data.elModule.totalModules}</div>
                    <div><strong>Conformité :</strong> <span class="text-2xl font-bold ${data.elModule.conformityRate >= 80 ? 'text-green-600' : 'text-red-600'}">${data.elModule.conformityRate}%</span></div>
                </div>
                
                <h3 class="text-xl font-bold mb-4">Statistiques Défauts</h3>
                <div class="grid grid-cols-3 gap-3">
                    <div class="stat-card border-l-green-500">
                        <div class="text-3xl font-black text-green-600">${data.elModule.stats.ok}</div>
                        <div class="text-sm">Modules OK</div>
                    </div>
                    <div class="stat-card border-l-yellow-500">
                        <div class="text-3xl font-black text-yellow-600">${data.elModule.stats.inequality}</div>
                        <div class="text-sm">Inégalités</div>
                    </div>
                    <div class="stat-card border-l-orange-500">
                        <div class="text-3xl font-black text-orange-600">${data.elModule.stats.microcracks}</div>
                        <div class="text-sm">Microfissures</div>
                    </div>
                    <div class="stat-card border-l-red-500">
                        <div class="text-3xl font-black text-red-600">${data.elModule.stats.dead}</div>
                        <div class="text-sm">Modules HS</div>
                    </div>
                    <div class="stat-card border-l-blue-500">
                        <div class="text-3xl font-black text-blue-600">${data.elModule.stats.string_open}</div>
                        <div class="text-sm">Strings Ouverts</div>
                    </div>
                    <div class="stat-card border-l-gray-500">
                        <div class="text-3xl font-black text-gray-600">${data.elModule.stats.not_connected}</div>
                        <div class="text-sm">Non Raccordés</div>
                    </div>
                </div>
                
                ${data.elModule.criticalDefects.length > 0 ? `
                <h3 class="text-xl font-bold mb-4 mt-6">Défauts Critiques (Top 10)</h3>
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <table class="w-full text-sm">
                        <thead class="bg-red-100">
                            <tr>
                                <th class="p-2 text-left">Module ID</th>
                                <th class="p-2 text-left">Statut</th>
                                <th class="p-2 text-left">Commentaire</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.elModule.criticalDefects.slice(0, 10).map(d => `
                            <tr class="border-t border-red-200">
                                <td class="p-2 font-mono">${d.moduleId}</td>
                                <td class="p-2"><span class="px-2 py-1 bg-red-200 rounded text-xs font-bold">${d.status}</span></td>
                                <td class="p-2">${d.comment || '-'}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}
                
                <!-- Graphique Défauts EL (Camembert) -->
                ${data.elModule.totalModules > 0 ? `
                <div class="mt-6">
                    <h3 class="text-xl font-bold mb-4">Répartition Défauts</h3>
                    <div class="bg-white p-4 rounded-lg" style="height: 300px;">
                        <canvas id="elDefectsChart"></canvas>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}
        
        <!-- ====================================================================
             MODULE IV - COURBES I-V
        ==================================================================== -->
        ${data.ivModule.hasData ? `
        <div class="page-break">
            <div class="module-section">
                <h2 class="text-3xl font-bold mb-6 text-gray-800 border-b-4 border-blue-500 pb-3">
                    <i class="fas fa-chart-line text-blue-600 mr-3"></i>
                    MODULE COURBES I-V
                </h2>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div><strong>Total Courbes :</strong> ${data.ivModule.totalCurves}</div>
                    <div><strong>Hors Tolérance :</strong> <span class="text-xl font-bold text-red-600">${data.ivModule.outOfToleranceCount}</span></div>
                </div>
                
                <h3 class="text-xl font-bold mb-4">Moyennes Mesures</h3>
                <div class="grid grid-cols-3 gap-4">
                    <div class="stat-card border-l-purple-500">
                        <div class="text-3xl font-black text-purple-600">${data.ivModule.avgFF.toFixed(2)}</div>
                        <div class="text-sm">Fill Factor Moyen</div>
                    </div>
                    <div class="stat-card border-l-indigo-500">
                        <div class="text-3xl font-black text-indigo-600">${data.ivModule.avgRds.toFixed(2)} Ω</div>
                        <div class="text-sm">Rds Moyen</div>
                    </div>
                    <div class="stat-card border-l-cyan-500">
                        <div class="text-3xl font-black text-cyan-600">${data.ivModule.avgUf.toFixed(2)} V</div>
                        <div class="text-sm">Uf Moyen</div>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- ====================================================================
             MODULE VISUELS - CONTRÔLES IEC 62446-1
        ==================================================================== -->
        ${data.visualModule.hasData ? `
        <div class="page-break">
            <div class="module-section">
                <h2 class="text-3xl font-bold mb-6 text-gray-800 border-b-4 border-orange-500 pb-3">
                    <i class="fas fa-eye text-orange-600 mr-3"></i>
                    MODULE CONTRÔLES VISUELS IEC 62446-1
                </h2>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div><strong>Token Inspection :</strong> ${data.visualModule.inspectionToken}</div>
                    <div><strong>Date Inspection :</strong> ${new Date(data.visualModule.inspectionDate).toLocaleDateString('fr-FR')}</div>
                </div>
                
                <h3 class="text-xl font-bold mb-4">Checklist IEC 62446-1</h3>
                <div class="grid grid-cols-4 gap-3 mb-6">
                    <div class="stat-card border-l-gray-500">
                        <div class="text-2xl font-black">${data.visualModule.checklist.totalItems}</div>
                        <div class="text-xs">Items Total</div>
                    </div>
                    <div class="stat-card border-l-blue-500">
                        <div class="text-2xl font-black">${data.visualModule.checklist.checkedItems}</div>
                        <div class="text-xs">Vérifiés</div>
                    </div>
                    <div class="stat-card border-l-green-500">
                        <div class="text-2xl font-black">${data.visualModule.checklist.conformItems}</div>
                        <div class="text-xs">Conformes</div>
                    </div>
                    <div class="stat-card border-l-red-500">
                        <div class="text-2xl font-black">${data.visualModule.checklist.nonConformItems}</div>
                        <div class="text-xs">Non-Conformes</div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <div class="text-lg font-bold mb-2">Conformité Checklist: <span class="${data.visualModule.checklist.conformityRate >= 80 ? 'text-green-600' : 'text-red-600'}">${data.visualModule.checklist.conformityRate}%</span></div>
                    <div class="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full ${data.visualModule.checklist.conformityRate >= 80 ? 'bg-green-600' : 'bg-red-600'}" style="width: ${data.visualModule.checklist.conformityRate}%"></div>
                    </div>
                </div>
                
                ${data.visualModule.defects.length > 0 ? `
                <h3 class="text-xl font-bold mb-4 mt-6">Défauts Identifiés (Top 20)</h3>
                <div class="space-y-2">
                    ${data.visualModule.defects.slice(0, 20).map(d => `
                    <div class="border-l-4 ${d.severity === 'critical' ? 'border-red-500 bg-red-50' : d.severity === 'major' ? 'border-orange-500 bg-orange-50' : 'border-yellow-500 bg-yellow-50'} p-3 rounded">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <div class="font-bold">${d.location}</div>
                                <div class="text-sm text-gray-600">${d.equipmentType} - ${d.defectType}</div>
                                <div class="text-sm mt-1">${d.description}</div>
                                ${d.recommendedAction ? `<div class="text-sm text-blue-700 mt-1"><strong>Action:</strong> ${d.recommendedAction}</div>` : ''}
                            </div>
                            <span class="px-3 py-1 rounded text-xs font-bold ${d.severity === 'critical' ? 'bg-red-200 text-red-800' : d.severity === 'major' ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'}">
                                ${d.severity.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}
        
        <!-- ====================================================================
             MODULE ISOLATION - TESTS DC/AC
        ==================================================================== -->
        ${data.isolationModule.hasData ? `
        <div class="page-break">
            <div class="module-section">
                <h2 class="text-3xl font-bold mb-6 text-gray-800 border-b-4 border-yellow-500 pb-3">
                    <i class="fas fa-bolt text-yellow-600 mr-3"></i>
                    MODULE TESTS ISOLATION IEC 62446
                </h2>
                
                <div class="grid grid-cols-3 gap-4 mb-6">
                    <div class="stat-card border-l-gray-500">
                        <div class="text-3xl font-black">${data.isolationModule.totalTests}</div>
                        <div class="text-sm">Tests Total</div>
                    </div>
                    <div class="stat-card border-l-green-500">
                        <div class="text-3xl font-black text-green-600">${data.isolationModule.conformTests}</div>
                        <div class="text-sm">Conformes (>1 MΩ)</div>
                    </div>
                    <div class="stat-card border-l-red-500">
                        <div class="text-3xl font-black text-red-600">${data.isolationModule.nonConformTests}</div>
                        <div class="text-sm">Non-Conformes</div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <div class="text-lg font-bold mb-2">Conformité Isolation: <span class="${data.isolationModule.conformityRate >= 80 ? 'text-green-600' : 'text-red-600'}">${data.isolationModule.conformityRate}%</span></div>
                    <div class="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full ${data.isolationModule.conformityRate >= 80 ? 'bg-green-600' : 'bg-red-600'}" style="width: ${data.isolationModule.conformityRate}%"></div>
                    </div>
                </div>
                
                <h3 class="text-xl font-bold mb-4">Moyennes Mesures</h3>
                <div class="grid grid-cols-2 gap-3">
                    <div class="stat-card border-l-purple-500">
                        <div class="text-2xl font-black text-purple-600">${data.isolationModule.avgMeasurements.dcPosEarth} MΩ</div>
                        <div class="text-sm">DC+ vers Terre</div>
                    </div>
                    <div class="stat-card border-l-indigo-500">
                        <div class="text-2xl font-black text-indigo-600">${data.isolationModule.avgMeasurements.dcNegEarth} MΩ</div>
                        <div class="text-sm">DC- vers Terre</div>
                    </div>
                    <div class="stat-card border-l-blue-500">
                        <div class="text-2xl font-black text-blue-600">${data.isolationModule.avgMeasurements.dcPosNeg} MΩ</div>
                        <div class="text-sm">DC+ vers DC-</div>
                    </div>
                    <div class="stat-card border-l-cyan-500">
                        <div class="text-2xl font-black text-cyan-600">${data.isolationModule.avgMeasurements.acEarth} MΩ</div>
                        <div class="text-sm">AC vers Terre</div>
                    </div>
                </div>
                
                ${data.isolationModule.latestTest ? `
                <h3 class="text-xl font-bold mb-4 mt-6">Dernier Test</h3>
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>Date:</strong> ${new Date(data.isolationModule.latestTest.testDate).toLocaleDateString('fr-FR')}</div>
                        <div><strong>Conformité:</strong> <span class="font-bold ${data.isolationModule.latestTest.isConform ? 'text-green-600' : 'text-red-600'}">${data.isolationModule.latestTest.isConform ? 'CONFORME' : 'NON-CONFORME'}</span></div>
                        ${data.isolationModule.latestTest.dcPositiveToEarth ? `<div><strong>DC+ Terre:</strong> ${data.isolationModule.latestTest.dcPositiveToEarth} MΩ</div>` : ''}
                        ${data.isolationModule.latestTest.dcNegativeToEarth ? `<div><strong>DC- Terre:</strong> ${data.isolationModule.latestTest.dcNegativeToEarth} MΩ</div>` : ''}
                        ${data.isolationModule.latestTest.dcPositiveToNegative ? `<div><strong>DC+/DC-:</strong> ${data.isolationModule.latestTest.dcPositiveToNegative} MΩ</div>` : ''}
                        ${data.isolationModule.latestTest.acToEarth ? `<div><strong>AC Terre:</strong> ${data.isolationModule.latestTest.acToEarth} MΩ</div>` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}
        
        <!-- ====================================================================
             RECOMMANDATIONS
        ==================================================================== -->
        ${data.recommendations.length > 0 ? `
        <div class="page-break">
            <div class="module-section">
                <h2 class="text-3xl font-bold mb-6 text-gray-800 border-b-4 border-red-500 pb-3">
                    <i class="fas fa-clipboard-check text-red-600 mr-3"></i>
                    RECOMMANDATIONS & PLAN D'ACTION
                </h2>
                
                <div class="space-y-4">
                    ${data.recommendations.map((rec, index) => `
                    <div class="stat-card priority-${rec.priority}">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex-1">
                                <div class="text-xl font-bold text-gray-800">#${index + 1} - ${rec.title}</div>
                                <div class="text-sm text-gray-600 mt-1">${rec.description}</div>
                            </div>
                            <span class="px-3 py-1 rounded text-xs font-bold ${rec.priority === 'urgent' ? 'bg-red-200 text-red-800' : rec.priority === 'high' ? 'bg-orange-200 text-orange-800' : rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}">
                                ${rec.priority.toUpperCase()}
                            </span>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-sm mt-3">
                            <div><strong>Catégorie:</strong> ${rec.category}</div>
                            ${rec.deadline ? `<div><strong>Délai:</strong> ${rec.deadline}</div>` : '<div></div>'}
                            ${rec.estimatedImpact ? `<div><strong>Impact:</strong> ${rec.estimatedImpact}</div>` : '<div></div>'}
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- ====================================================================
             SIGNATURES
        ==================================================================== -->
        <div class="module-section">
            <h2 class="text-2xl font-bold mb-6 text-gray-800 text-center">
                <i class="fas fa-signature text-blue-600 mr-3"></i>
                SIGNATURES & CERTIFICATION
            </h2>
            
            <div class="grid grid-cols-2 gap-8 mb-6">
                <div class="border-2 border-gray-300 rounded-lg p-6 text-center">
                    <div class="text-lg font-bold text-gray-800 mb-4">Auditeur Terrain</div>
                    <div class="h-24 flex items-center justify-center mb-4">
                        <div class="text-6xl text-gray-300">
                            <i class="fas fa-pen-fancy"></i>
                        </div>
                    </div>
                    <div class="text-gray-700 font-semibold">${data.generatedBy || 'Diagnostic Photovoltaïque'}</div>
                    <div class="text-sm text-gray-500">Expert Indépendant</div>
                </div>
                
                <div class="border-2 border-gray-300 rounded-lg p-6 text-center">
                    <div class="text-lg font-bold text-gray-800 mb-4">Validation Technique</div>
                    <div class="h-24 flex items-center justify-center mb-4">
                        <div class="text-6xl text-gray-300">
                            <i class="fas fa-stamp"></i>
                        </div>
                    </div>
                    <div class="text-gray-700 font-semibold">Fabien CORRERA</div>
                    <div class="text-sm text-gray-500">Fondateur DiagPV</div>
                </div>
            </div>
            
            <div class="bg-green-50 border-2 border-green-500 rounded-lg p-4 text-center">
                <div class="flex items-center justify-center text-green-800 font-bold text-xl mb-2">
                    <i class="fas fa-certificate text-3xl mr-3"></i>
                    RAPPORT CERTIFIÉ DIAGPV
                </div>
                <p class="text-green-700 text-sm">Ce rapport a été établi conformément aux normes IEC 62446-1 et reflète l'état de l'installation au moment de l'audit.</p>
            </div>
        </div>
        
        <!-- ====================================================================
             FOOTER DIAGPV
        ==================================================================== -->
        <div class="module-section text-center">
            <div class="text-2xl font-bold text-green-600 mb-2">DIAGNOSTIC PHOTOVOLTAÏQUE</div>
            <div class="text-gray-600 mb-4">Expertise Indépendante Photovoltaïque</div>
            <div class="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <div class="font-bold">Adresse</div>
                    <div>3 rue d'Apollo</div>
                    <div>31240 L'Union</div>
                </div>
                <div>
                    <div class="font-bold">Contact</div>
                    <div>📞 05.81.10.16.59</div>
                    <div>📧 contact@diagpv.fr</div>
                </div>
                <div>
                    <div class="font-bold">Web</div>
                    <div>www.diagnosticphotovoltaique.fr</div>
                    <div>RCS 792972309</div>
                </div>
            </div>
            <div class="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-300">
                Rapport généré le ${date} - Token: ${data.reportToken}<br>
                Conformité normes: IEC 62446-1, IEC 61215, IEC 61730, NF C 15-100, UTE C 15-712-1
            </div>
        </div>
        
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script>
        // ========================================================================
        // GRAPHIQUES CHART.JS
        // ========================================================================
        
        // Graphique Conformité par Module (Barres)
        const conformityCtx = document.getElementById('conformityChart');
        if (conformityCtx) {
            new Chart(conformityCtx, {
                type: 'bar',
                data: {
                    labels: [
                        ${data.elModule.hasData ? `'EL (${data.elModule.conformityRate}%)',` : ''}
                        ${data.ivModule.hasData ? `'IV (${Math.round(((data.ivModule.totalCurves - data.ivModule.outOfToleranceCount) / data.ivModule.totalCurves) * 100)}%)',` : ''}
                        ${data.visualModule.hasData ? `'Visuels (${data.visualModule.checklist.conformityRate}%)',` : ''}
                        ${data.isolationModule.hasData ? `'Isolation (${data.isolationModule.conformityRate}%)',` : ''}
                        ${data.thermalModule.hasData ? `'Thermique',` : ''}
                    ],
                    datasets: [{
                        label: 'Conformité (%)',
                        data: [
                            ${data.elModule.hasData ? `${data.elModule.conformityRate},` : ''}
                            ${data.ivModule.hasData ? `${Math.round(((data.ivModule.totalCurves - data.ivModule.outOfToleranceCount) / data.ivModule.totalCurves) * 100)},` : ''}
                            ${data.visualModule.hasData ? `${data.visualModule.checklist.conformityRate},` : ''}
                            ${data.isolationModule.hasData ? `${data.isolationModule.conformityRate},` : ''}
                            ${data.thermalModule.hasData ? `0,` : ''}
                        ],
                        backgroundColor: [
                            ${data.elModule.hasData ? `'rgba(34, 197, 94, 0.8)',` : ''}
                            ${data.ivModule.hasData ? `'rgba(59, 130, 246, 0.8)',` : ''}
                            ${data.visualModule.hasData ? `'rgba(251, 146, 60, 0.8)',` : ''}
                            ${data.isolationModule.hasData ? `'rgba(234, 179, 8, 0.8)',` : ''}
                            ${data.thermalModule.hasData ? `'rgba(168, 85, 247, 0.8)',` : ''}
                        ],
                        borderColor: [
                            ${data.elModule.hasData ? `'rgb(34, 197, 94)',` : ''}
                            ${data.ivModule.hasData ? `'rgb(59, 130, 246)',` : ''}
                            ${data.visualModule.hasData ? `'rgb(251, 146, 60)',` : ''}
                            ${data.isolationModule.hasData ? `'rgb(234, 179, 8)',` : ''}
                            ${data.thermalModule.hasData ? `'rgb(168, 85, 247)',` : ''}
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Taux de Conformité par Module',
                            font: { size: 16, weight: 'bold' }
                        }
                    },
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
                    }
                }
            });
        }
        
        // Graphique Défauts EL (Camembert)
        const elDefectsCtx = document.getElementById('elDefectsChart');
        if (elDefectsCtx && ${data.elModule.hasData && data.elModule.totalModules > 0}) {
            new Chart(elDefectsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['OK', 'Inégalités', 'Microfissures', 'HS', 'String Ouvert', 'Non Raccordé'],
                    datasets: [{
                        data: [
                            ${data.elModule.stats.ok},
                            ${data.elModule.stats.inequality},
                            ${data.elModule.stats.microcracks},
                            ${data.elModule.stats.dead},
                            ${data.elModule.stats.string_open},
                            ${data.elModule.stats.not_connected}
                        ],
                        backgroundColor: [
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(234, 179, 8, 0.8)',
                            'rgba(251, 146, 60, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(156, 163, 175, 0.8)'
                        ],
                        borderColor: [
                            'rgb(34, 197, 94)',
                            'rgb(234, 179, 8)',
                            'rgb(251, 146, 60)',
                            'rgb(239, 68, 68)',
                            'rgb(59, 130, 246)',
                            'rgb(156, 163, 175)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        title: {
                            display: true,
                            text: 'Répartition des Défauts Électroluminescence',
                            font: { size: 14, weight: 'bold' }
                        }
                    }
                }
            });
        }
        
        // ========================================================================
        // EXPORT PDF
        // ========================================================================
        async function downloadPDF() {
            const button = event.target;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Génération PDF...';
            
            try {
                // Utiliser window.print() pour génération PDF navigateur
                // Plus fiable que html2pdf pour grands documents
                window.print();
                
                setTimeout(() => {
                    button.disabled = false;
                    button.innerHTML = '<i class="fas fa-download mr-2"></i>TÉLÉCHARGER';
                }, 2000);
            } catch (error) {
                console.error('Erreur génération PDF:', error);
                alert('Erreur génération PDF. Utilisez Ctrl+P puis "Enregistrer en PDF".');
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-download mr-2"></i>TÉLÉCHARGER';
            }
        }
    </script>
    
</body>
</html>
  `.trim();
}
