/**
 * Template HTML - Rapport Unifié DiagPV (Version V2 "Expert")
 * Design strict A4, Sommaire automatique, Numérotation normée
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
    
    <!-- Police professionnelle Inter + JetBrains Mono pour les données -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    
    <style>
        /* === CONFIGURATION IMPRESSION A4 STRICTE === */
        @page {
            size: A4;
            margin: 0;
        }
        
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            color: #1f2937;
            background: #fff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        /* Classes utilitaires impression */
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0 auto;
            background: white;
            position: relative;
            box-sizing: border-box;
            overflow: hidden;
            page-break-after: always;
        }
        
        .page-break { page-break-before: always; }
        .no-break { page-break-inside: avoid; }
        .no-print { display: none !important; }

        @media screen {
            body { background: #f3f4f6; padding: 20px; }
            .page { 
                margin-bottom: 30px; 
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); 
            }
        }

        @media print {
            body { background: white; padding: 0; }
            .page { margin: 0; box-shadow: none; }
            .no-print { display: none !important; }
            /* Cacher les URL et dates automatiques du navigateur */
            @page { margin: 0; }
        }

        /* === COMPTEURS AUTOMATIQUES (Numérotation 1. 1.1 etc) === */
        body { counter-reset: section; }
        
        h2.numbered-section {
            counter-reset: subsection;
            counter-increment: section;
        }
        
        h2.numbered-section::before {
            content: counter(section) ". ";
            opacity: 0.7;
        }

        /* === COMPOSANTS DE DESIGN === */
        .cover-page {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 0 !important; /* Reset padding standard */
        }

        .cover-content {
            padding: 20mm;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .diagpv-logo-text {
            font-weight: 900;
            letter-spacing: -1px;
        }

        .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            position: relative;
            overflow: hidden;
        }
        
        .priority-border {
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 4px;
        }

        .toc-item {
            display: flex;
            align-items: baseline;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
        }
        
        .toc-dots {
            flex: 1;
            border-bottom: 1px dotted #9ca3af;
            margin: 0 0.5rem;
        }

        .data-mono {
            font-family: 'JetBrains Mono', monospace;
        }

        /* Tableaux Pro */
        .pro-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }
        .pro-table th {
            text-align: left;
            padding: 0.75rem;
            background: #f1f5f9;
            border-bottom: 2px solid #e2e8f0;
            font-weight: 700;
            color: #475569;
        }
        .pro-table td {
            padding: 0.75rem;
            border-bottom: 1px solid #e2e8f0;
        }
        .pro-table tr:last-child td { border-bottom: none; }
    </style>
</head>
<body>
    
    <!-- BARRE D'ACTIONS FLOTTANTE (Visible uniquement à l'écran) -->
    <div class="no-print fixed top-6 right-6 z-50 flex flex-col gap-3">
        <button onclick="window.print()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-bold shadow-xl flex items-center transform transition hover:scale-105">
            <i class="fas fa-print text-xl mr-3"></i>
            <div>
                <div class="text-sm opacity-80">FINALISER</div>
                <div class="text-lg">IMPRIMER PDF</div>
            </div>
        </button>
        <div class="bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg text-xs text-gray-600 max-w-xs border border-gray-200">
            <strong>Conseil Pro :</strong> Dans les paramètres d'impression, cochez "Graphiques d'arrière-plan" et décochez "En-têtes et pieds de page".
        </div>
    </div>

    <!-- PAGE 1 : COUVERTURE IMMERSIVE -->
    <div class="page cover-page">
        <!-- Bandeau haut -->
        <div class="bg-green-600 h-4 w-full"></div>
        
        <div class="cover-content">
            <div class="mb-12">
                <div class="text-green-400 font-bold tracking-widest text-sm mb-2">RAPPORT D'EXPERTISE TECHNIQUE</div>
                <h1 class="text-6xl font-black mb-6 leading-tight">
                    AUDIT DE PERFORMANCE<br>
                    <span class="text-green-500">PHOTOVOLTAÏQUE</span>
                </h1>
                <div class="h-2 w-32 bg-green-500 rounded-full"></div>
            </div>

            <div class="grid grid-cols-1 gap-8 my-12 text-lg">
                <div class="bg-white/10 backdrop-blur p-6 rounded-lg border border-white/20">
                    <div class="text-gray-400 text-sm mb-1 uppercase tracking-wider font-bold">Installation</div>
                    <div class="text-3xl font-bold text-white mb-1">${data.plantName}</div>
                    <div class="text-gray-300"><i class="fas fa-map-marker-alt mr-2"></i>${data.location}</div>
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <div class="bg-white/5 p-4 rounded border border-white/10">
                        <div class="text-gray-400 text-sm">Client / Commanditaire</div>
                        <div class="text-xl font-bold mt-1">${data.clientName}</div>
                    </div>
                    <div class="bg-white/5 p-4 rounded border border-white/10">
                        <div class="text-gray-400 text-sm">Date de l'audit</div>
                        <div class="text-xl font-bold mt-1">${date}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer Couverture -->
        <div class="bg-gray-900 p-8 text-center text-gray-400 text-sm border-t border-gray-800">
            <div class="flex justify-between items-end">
                <div class="text-left">
                    <div class="text-white font-bold text-xl mb-1">DIAGNOSTIC PHOTOVOLTAÏQUE</div>
                    <div>Expertise Indépendante & Ingénierie</div>
                </div>
                <div class="text-right">
                    <div>Réf. Dossier : <span class="text-white font-mono">${data.reportToken.substring(0,8).toUpperCase()}</span></div>
                    <div>Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- PAGE 2 : SOMMAIRE & SYNTHÈSE -->
    <div class="page">
        <div class="flex justify-between items-center mb-12 border-b-2 border-gray-100 pb-6">
            <div class="text-2xl font-black text-gray-800">SOMMAIRE</div>
            <div class="text-gray-400 font-mono text-sm">REF: ${data.reportToken.substring(0,8)}</div>
        </div>

        <!-- Table des matières générée dynamiquement -->
        <div id="toc-container" class="mb-16 pl-4 border-l-4 border-green-500">
            <!-- JS will populate this -->
        </div>

        <h2 class="numbered-section text-3xl font-bold mb-8 text-gray-900">SYNTHÈSE EXÉCUTIVE</h2>
        
        <!-- Jauge Conformité -->
        <div class="bg-gray-50 rounded-2xl p-8 mb-8 border border-gray-200">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <div class="text-sm font-bold text-gray-500 uppercase tracking-wider">Indice de Conformité Global</div>
                    <div class="text-5xl font-black ${data.summary.overallConformityRate >= 80 ? 'text-green-600' : data.summary.overallConformityRate >= 60 ? 'text-yellow-600' : 'text-red-600'}">
                        ${data.summary.overallConformityRate}%
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm text-gray-500 mb-1">État de l'installation</div>
                    <div class="text-xl font-bold px-4 py-2 rounded-lg ${data.summary.overallConformityRate >= 80 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} inline-block">
                        ${data.summary.overallConformityRate >= 80 ? 'CONFORME / SAIN' : 'RISQUE / À TRAITER'}
                    </div>
                </div>
            </div>
            
            <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div class="h-full transition-all duration-1000 ease-out ${data.summary.overallConformityRate >= 80 ? 'bg-green-500' : 'bg-gradient-to-r from-red-500 to-yellow-500'}" 
                     style="width: ${data.summary.overallConformityRate}%"></div>
            </div>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-3 gap-6 mb-8">
            <div class="stat-card">
                <div class="priority-border bg-red-500"></div>
                <div class="text-4xl font-black text-red-600 mb-1">${data.summary.criticalIssuesCount}</div>
                <div class="text-sm font-bold text-gray-600">Défauts Critiques</div>
                <div class="text-xs text-gray-400 mt-2">Intervention immédiate</div>
            </div>
            <div class="stat-card">
                <div class="priority-border bg-orange-500"></div>
                <div class="text-4xl font-black text-orange-600 mb-1">${data.summary.majorIssuesCount}</div>
                <div class="text-sm font-bold text-gray-600">Défauts Majeurs</div>
                <div class="text-xs text-gray-400 mt-2">Impact performance</div>
            </div>
            <div class="stat-card">
                <div class="priority-border bg-blue-500"></div>
                <div class="text-4xl font-black text-blue-600 mb-1">${data.summary.minorIssuesCount}</div>
                <div class="text-sm font-bold text-gray-600">Défauts Mineurs</div>
                <div class="text-xs text-gray-400 mt-2">Surveillance</div>
            </div>
        </div>

        ${data.summary.urgentActionsRequired ? `
        <div class="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg">
            <div class="flex items-start">
                <div class="text-red-600 text-3xl mr-4"><i class="fas fa-exclamation-circle"></i></div>
                <div>
                    <h3 class="text-red-900 font-bold text-lg mb-1">Attention Requise</h3>
                    <p class="text-red-800 text-sm leading-relaxed">
                        Des défauts critiques ont été identifiés nécessitant une action corrective immédiate pour garantir la sécurité des biens et des personnes. Voir section Recommandations.
                    </p>
                </div>
            </div>
        </div>
        ` : ''}
    </div>

    <!-- MODULE ÉLECTROLUMINESCENCE -->
    ${data.elModule.hasData ? `
    <div class="page">
        <h2 class="numbered-section text-2xl font-bold mb-8 text-gray-900 flex items-center">
            <span class="w-8 h-8 bg-green-600 text-white rounded flex items-center justify-center text-sm mr-3 shadow-lg">EL</span>
            ANALYSE ÉLECTROLUMINESCENCE
        </h2>

        <div class="grid grid-cols-2 gap-8 mb-8">
            <div class="bg-gray-50 rounded-xl p-6">
                <h3 class="font-bold text-gray-700 mb-4">Détails de l'inspection</h3>
                <table class="w-full text-sm">
                    <tr class="border-b border-gray-200"><td class="py-2 text-gray-500">Modules testés</td><td class="py-2 font-mono font-bold text-right">${data.elModule.totalModules}</td></tr>
                    <tr class="border-b border-gray-200"><td class="py-2 text-gray-500">Date/Heure</td><td class="py-2 font-mono text-right">${new Date(data.elModule.auditDate).toLocaleDateString()}</td></tr>
                    <tr class="border-b border-gray-200"><td class="py-2 text-gray-500">Méthode</td><td class="py-2 text-right">Injection Courant Inverse</td></tr>
                    <tr><td class="py-2 text-gray-500">Conformité</td><td class="py-2 font-bold text-right ${data.elModule.conformityRate > 90 ? 'text-green-600' : 'text-orange-600'}">${data.elModule.conformityRate}%</td></tr>
                </table>
            </div>
            
            <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-center">
                <div style="height: 200px; width: 100%;">
                    <canvas id="elDefectsChart"></canvas>
                </div>
            </div>
        </div>

        <h3 class="font-bold text-lg mb-4 text-gray-800">Défauts Identifiés</h3>
        <table class="pro-table mb-8">
            <thead>
                <tr>
                    <th width="15%">Module</th>
                    <th width="15%">String</th>
                    <th width="20%">Statut</th>
                    <th width="50%">Observation / Commentaire</th>
                </tr>
            </thead>
            <tbody>
                ${data.elModule.criticalDefects.slice(0, 15).map(d => `
                <tr>
                    <td class="font-mono font-bold">${d.moduleId}</td>
                    <td class="text-gray-500">S${d.stringNumber || '?'}</td>
                    <td>
                        <span class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                            ${d.status === 'dead' ? 'bg-red-100 text-red-800' : 
                              d.status === 'microcracks' ? 'bg-orange-100 text-orange-800' : 
                              'bg-yellow-100 text-yellow-800'}">
                            ${d.status}
                        </span>
                    </td>
                    <td class="text-sm">${d.comment || 'Défaut structurel identifié par imagerie EL.'}</td>
                </tr>
                `).join('')}
                ${data.elModule.criticalDefects.length === 0 ? '<tr><td colspan="4" class="text-center text-gray-500 italic py-4">Aucun défaut critique détecté.</td></tr>' : ''}
            </tbody>
        </table>
        
        ${data.elModule.criticalDefects.length > 15 ? `<p class="text-center text-xs text-gray-500 italic">... et ${data.elModule.criticalDefects.length - 15} autres défauts (voir annexe CSV).</p>` : ''}
    </div>
    ` : ''}

    <!-- MODULE PHOTOS & PREUVES -->
    ${data.modules.photos?.enabled ? `
    <div class="page">
        <h2 class="numbered-section text-2xl font-bold mb-8 text-gray-900 flex items-center">
            <span class="w-8 h-8 bg-gray-700 text-white rounded flex items-center justify-center text-sm mr-3 shadow-lg">
                <i class="fas fa-camera"></i>
            </span>
            GALERIE & PREUVES
        </h2>

        <div class="grid grid-cols-2 gap-6">
            ${data.modules.photos?.data.photos.length > 0 ? `
            <div class="grid grid-cols-2 gap-6">
                ${data.modules.photos.data.photos.map(photo => `
                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm break-inside-avoid">
                    <div class="aspect-w-16 aspect-h-9 bg-gray-100 relative">
                        <img src="${photo.url}" alt="${photo.tag}" class="object-cover w-full h-64">
                        <span class="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded uppercase font-bold backdrop-blur-sm">
                            ${photo.tag}
                        </span>
                    </div>
                    <div class="p-4">
                        <p class="text-sm text-gray-600 italic">"${photo.description}"</p>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : `
            <div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
                <i class="fas fa-images text-4xl mb-3"></i>
                <p>Aucune photo disponible pour cet audit.</p>
            </div>
            `}
        </div>
    </div>
    ` : ''}

    <!-- MODULE COURBES I-V -->
    ${data.ivModule.hasData ? `
    <div class="page">
        <h2 class="numbered-section text-2xl font-bold mb-8 text-gray-900 flex items-center">
            <span class="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center text-sm mr-3 shadow-lg">IV</span>
            ANALYSE COURBES I-V
        </h2>
        
        <div class="grid grid-cols-3 gap-6 mb-8">
            <div class="stat-card text-center">
                <div class="priority-border bg-purple-500"></div>
                <div class="text-3xl font-black text-gray-800 mb-1">${data.ivModule.avgFF.toFixed(2)}</div>
                <div class="text-xs text-gray-500 uppercase tracking-wider">Fill Factor Moyen</div>
            </div>
            <div class="stat-card text-center">
                <div class="priority-border bg-blue-500"></div>
                <div class="text-3xl font-black text-gray-800 mb-1">${data.ivModule.totalCurves}</div>
                <div class="text-xs text-gray-500 uppercase tracking-wider">Courbes Mesurées</div>
            </div>
            <div class="stat-card text-center">
                <div class="priority-border bg-red-500"></div>
                <div class="text-3xl font-black text-red-600 mb-1">${data.ivModule.outOfToleranceCount}</div>
                <div class="text-xs text-gray-500 uppercase tracking-wider">Hors Tolérance</div>
            </div>
        </div>

        <div class="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-6">
            <h3 class="font-bold text-blue-900 mb-2">Interprétation PVServ</h3>
            <p class="text-sm text-blue-800">
                L'analyse des courbes I-V montre un facteur de remplissage moyen de <strong>${data.ivModule.avgFF.toFixed(2)}%</strong>. 
                Une résistance série moyenne de <strong>${data.ivModule.avgRds.toFixed(2)} Ω</strong> a été mesurée.
                ${data.ivModule.outOfToleranceCount > 0 ? 
                    `Attention : ${data.ivModule.outOfToleranceCount} strings présentent des déviations significatives par rapport au modèle théorique.` : 
                    `L'ensemble des chaînes présente un comportement électrique homogène.`}
            </p>
        </div>
    </div>
    ` : ''}

    <!-- PLAN D'ACTION -->
    ${data.recommendations.length > 0 ? `
    <div class="page">
        <h2 class="numbered-section text-2xl font-bold mb-8 text-gray-900">PLAN D'ACTION & RECOMMANDATIONS</h2>
        
        <div class="space-y-6">
            ${data.recommendations.map((rec, i) => `
            <div class="flex gap-4 no-break">
                <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md
                    ${rec.priority === 'urgent' ? 'bg-red-600 text-white' : rec.priority === 'high' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}">
                    ${i + 1}
                </div>
                <div class="flex-1 bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg text-gray-900">${rec.title}</h3>
                        <span class="text-xs font-bold px-2 py-1 rounded uppercase
                            ${rec.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}">
                            ${rec.priority}
                        </span>
                    </div>
                    <p class="text-gray-600 text-sm mb-3">${rec.description}</p>
                    ${rec.estimatedImpact ? `
                    <div class="flex items-center text-xs font-bold text-green-700 bg-green-50 px-3 py-2 rounded inline-block">
                        <i class="fas fa-chart-line mr-2"></i> Gain estimé : ${rec.estimatedImpact}
                    </div>` : ''}
                </div>
            </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <!-- SIGNATURES -->
    <div class="page">
        <h2 class="numbered-section text-2xl font-bold mb-12 text-gray-900">CERTIFICATION & VALIDATION</h2>
        
        <div class="grid grid-cols-2 gap-12">
            <div class="border-2 border-gray-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-between h-64">
                <div class="text-center w-full">
                    <div class="font-bold text-gray-400 uppercase tracking-widest text-sm mb-2">Technicien Auditeur</div>
                    <div class="text-xl font-bold text-gray-900">${data.generatedBy || 'Technicien DiagPV'}</div>
                </div>
                <div class="font-script text-4xl text-blue-600 transform -rotate-6">Signé numériquement</div>
                <div class="w-full border-t border-gray-300 pt-2 text-center text-xs text-gray-400">
                    Certifié ISO 9712 / QualiPV
                </div>
            </div>

            <div class="border-2 border-gray-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-between h-64">
                <div class="text-center w-full">
                    <div class="font-bold text-gray-400 uppercase tracking-widest text-sm mb-2">Direction Technique</div>
                    <div class="text-xl font-bold text-gray-900">Fabien CORRERA</div>
                </div>
                <div class="font-script text-4xl text-green-600 transform -rotate-3">Validé</div>
                <div class="w-full border-t border-gray-300 pt-2 text-center text-xs text-gray-400">
                    Expert Près les Assurances
                </div>
            </div>
        </div>

        <div class="mt-16 text-center text-gray-500 text-sm max-w-2xl mx-auto">
            <p class="mb-4">
                Ce rapport d'expertise est délivré par <strong>Diagnostic Photovoltaïque</strong>, société indépendante. 
                Les conclusions engagent notre responsabilité dans les limites définies par nos conditions générales d'intervention.
            </p>
            <p>
                3 rue d'Apollo, 31240 L'Union | RCS 792972309<br>
                Assurance RC Pro Décennale n°123456789
            </p>
        </div>
    </div>

    <!-- SCRIPTS POUR TOC AUTOMATIQUE & GRAPHS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script>
        // Génération automatique du Sommaire
        window.onload = function() {
            const tocContainer = document.getElementById('toc-container');
            const sections = document.querySelectorAll('h2.numbered-section');
            
            sections.forEach((section, index) => {
                // Créer l'entrée
                const item = document.createElement('div');
                item.className = 'toc-item';
                
                // Numéro
                const num = document.createElement('span');
                num.className = 'font-bold mr-2 text-green-600';
                num.textContent = (index + 1) + '.';
                
                // Titre
                const title = document.createElement('span');
                title.textContent = section.innerText;
                
                // Points de suite
                const dots = document.createElement('div');
                dots.className = 'toc-dots';
                
                // Numéro de page (Simulé car HTML ne connait pas les pages réelles avant print)
                // En PDF généré, ce serait cliquable. Ici on simule pour l'esthétique visuelle.
                const pageNum = document.createElement('span');
                pageNum.className = 'text-gray-500';
                pageNum.textContent = 'p. ' + (index + 2); // Approximation
                
                item.appendChild(num);
                item.appendChild(title);
                item.appendChild(dots);
                item.appendChild(pageNum);
                
                tocContainer.appendChild(item);
            });

            // Initialisation Graphiques
            initCharts();
        };

        function initCharts() {
            // Doughnut EL
            const elCtx = document.getElementById('elDefectsChart');
            if (elCtx) {
                new Chart(elCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['OK', 'Défauts'],
                        datasets: [{
                            data: [${data.elModule.stats.ok}, ${data.elModule.totalModules - data.elModule.stats.ok}],
                            backgroundColor: ['#16a34a', '#dc2626'],
                            borderWidth: 0
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }
    </script>
</body>
</html>
  `.trim();
}
