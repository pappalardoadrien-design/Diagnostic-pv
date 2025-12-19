import { getLayout } from './layout.js';

export function getRapportsPage() {
  // Simulé : Données complètes du projet Brugnac
  const auditData = {
    ref: "SOL BRUGNAC",
    date: "12 SEPTEMBRE 2025",
    dates_intervention: "du 2 au 5 septembre 2025",
    lieu: "BRUGNAC (47260)",
    gps: "44.4433, 0.4773",
    contexte: "En juin 2025, l’installation photovoltaïque au sol a subi d’importants dégâts dus à un épisode de grêle. Lors d’un contrôle visuel effectué par l’installateur, plus de 200 dommages ont été relevés au niveau du verre des modules.",
    mission: "La mission confiée à notre équipe consistait à déterminer si les modules photovoltaïques non endommagés visuellement présentaient des défauts internes (microfissures) via électroluminescence.",
    specs: {
        puissance: "250 kWc",
        nb_panneaux: "650",
        marque: "SunPower",
        tech: "Mono-Perc",
        orientation: "SUD 180°",
        mise_en_service: "15/01/2020",
        raccordement: "Injection HTA"
    },
    meteo: {
        ciel: "Dégagé",
        temp: "24°C",
        vent: "Faible (10 km/h Ouest)",
        irradiance: "N/A (Nuit)"
    },
    defauts: [
        { id: "M-102", type: "Impact Grêle (X-Shape)", severite: "Critique", img: "https://t4.ftcdn.net/jpg/01/56/16/17/360_F_156161722_fM5k5J5x5x5x5x5x.jpg" }, // Placeholder
        { id: "M-103", type: "Micro-fissures multiples", severite: "Majeur", img: "https://t4.ftcdn.net/jpg/01/56/16/17/360_F_156161722_fM5k5J5x5x5x5x5x.jpg" },
        { id: "M-145", type: "Déconnexion Cellule", severite: "Critique", img: "https://t4.ftcdn.net/jpg/01/56/16/17/360_F_156161722_fM5k5J5x5x5x5x5x.jpg" },
        { id: "M-201", type: "Défaut d'isolement (Suspecté)", severite: "Majeur", img: "https://t4.ftcdn.net/jpg/01/56/16/17/360_F_156161722_fM5k5J5x5x5x5x5x.jpg" },
    ],
    stats: {
        total: 650,
        ok: 420,
        mineur: 150,
        majeur: 50,
        critique: 30
    }
  };

  const content = `
    <!-- HEADER ACTIONS -->
    <div class="max-w-5xl mx-auto mb-8 print:hidden flex justify-between items-center">
        <div>
            <h1 class="text-2xl font-black text-slate-900">Générateur de Rapports</h1>
            <p class="text-slate-500">Mode: Audit Complet (Expertise)</p>
        </div>
        <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2">
            <i class="fas fa-print"></i> Imprimer le Rapport PDF
        </button>
    </div>

    <!-- ================================================================================================ -->
    <!-- PAGE 1 : COUVERTURE -->
    <!-- ================================================================================================ -->
    <div class="report-page relative bg-white shadow-2xl print:shadow-none p-[2cm] flex flex-col justify-between">
        
        <!-- EN-TÊTE -->
        <div class="flex justify-between items-start border-b-2 border-green-500 pb-6">
            <div>
                <div class="flex items-center gap-3 text-green-600 mb-2">
                    <i class="fas fa-solar-panel text-4xl"></i>
                    <span class="text-2xl font-black tracking-tighter">DIAG<span class="text-slate-800">PV</span></span>
                </div>
                <div class="text-xs text-slate-500 font-medium leading-relaxed">
                    3 Rue Apollo, 31240 L’UNION<br>
                    05.81.10.16.59 • contact@diagpv.fr<br>
                    RCS 792972309
                </div>
            </div>
            <div class="text-right">
                <div class="text-5xl font-black text-slate-100">2025</div>
                <div class="text-sm font-bold text-green-600 uppercase tracking-widest mt-1">Rapport d'Expertise</div>
            </div>
        </div>

        <!-- TITRE -->
        <div class="text-center my-auto">
            <div class="inline-block px-6 py-2 bg-green-50 text-green-800 font-bold text-sm rounded-full mb-6 uppercase tracking-wide border border-green-100">
                Audit Technique • Électroluminescence
            </div>
            <h1 class="text-6xl font-black text-slate-900 mb-6 leading-tight">
                SITE REF :<br><span class="text-green-600">${auditData.ref}</span>
            </h1>
            <p class="text-2xl text-slate-500 font-medium">${auditData.date}</p>
        </div>

        <!-- ILLUSTRATION -->
        <div class="h-64 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center relative overflow-hidden mb-12">
            <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 20px 20px;"></div>
            <i class="fas fa-camera-retro text-6xl text-slate-300"></i>
            <div class="absolute bottom-4 right-4 bg-white/80 px-3 py-1 rounded text-xs font-bold text-slate-500 backdrop-blur">
                Vue d'ensemble du site
            </div>
        </div>

        <!-- PIED DE PAGE -->
        <div class="text-center text-slate-400 text-xs uppercase tracking-widest border-t border-slate-100 pt-6">
            Diagnostic Photovoltaïque • Expertise Indépendante & Technique • ${auditData.lieu}
        </div>
    </div>

    <!-- ================================================================================================ -->
    <!-- PAGE 2 : CONTEXTE & FICHE TECHNIQUE -->
    <!-- ================================================================================================ -->
    <div class="report-page bg-white shadow-2xl print:shadow-none p-[2cm] mt-8 print:mt-0 relative">
        
        <!-- HEADER LIGHT -->
        <div class="flex justify-between items-center border-b border-slate-100 pb-4 mb-8">
            <span class="text-xs font-bold text-slate-400 uppercase">Réf: ${auditData.ref}</span>
            <span class="text-xs font-bold text-slate-400">Page 2</span>
        </div>

        <h2 class="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <span class="w-8 h-8 bg-slate-900 text-white rounded flex items-center justify-center text-sm">1</span>
            Contexte & Mission
        </h2>

        <div class="grid gap-8 mb-12">
            <div class="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 class="font-bold text-slate-800 mb-2 uppercase text-sm tracking-wide">Contexte</h3>
                <p class="text-slate-600 text-sm leading-relaxed text-justify">
                    ${auditData.contexte}
                </p>
            </div>
            
            <div class="pl-6 border-l-4 border-green-500">
                <h3 class="font-bold text-green-700 mb-2 uppercase text-sm tracking-wide">Objectif de la mission</h3>
                <p class="text-slate-600 text-sm leading-relaxed text-justify">
                    ${auditData.mission}
                </p>
            </div>
        </div>

        <h2 class="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <span class="w-8 h-8 bg-slate-900 text-white rounded flex items-center justify-center text-sm">2</span>
            Fiche Technique Installation
        </h2>

        <div class="overflow-hidden rounded-xl border border-slate-200">
            <table class="w-full text-sm">
                <tbody>
                    <tr class="border-b border-slate-100">
                        <td class="py-3 px-4 font-bold text-slate-500 w-1/2 bg-slate-50">Puissance Centrale</td>
                        <td class="py-3 px-4 font-black text-slate-900">${auditData.specs.puissance}</td>
                    </tr>
                    <tr class="border-b border-slate-100">
                        <td class="py-3 px-4 font-bold text-slate-500 bg-slate-50">Nombre de Modules</td>
                        <td class="py-3 px-4 font-bold text-slate-800">${auditData.specs.nb_panneaux}</td>
                    </tr>
                    <tr class="border-b border-slate-100">
                        <td class="py-3 px-4 font-bold text-slate-500 bg-slate-50">Marque / Modèle</td>
                        <td class="py-3 px-4 font-bold text-slate-800">${auditData.specs.marque}</td>
                    </tr>
                    <tr class="border-b border-slate-100">
                        <td class="py-3 px-4 font-bold text-slate-500 bg-slate-50">Technologie</td>
                        <td class="py-3 px-4 font-bold text-slate-800">${auditData.specs.tech}</td>
                    </tr>
                    <tr class="border-b border-slate-100">
                        <td class="py-3 px-4 font-bold text-slate-500 bg-slate-50">Orientation</td>
                        <td class="py-3 px-4 font-bold text-slate-800">${auditData.specs.orientation}</td>
                    </tr>
                    <tr>
                        <td class="py-3 px-4 font-bold text-slate-500 bg-slate-50">Mise en service</td>
                        <td class="py-3 px-4 font-bold text-slate-800">${auditData.specs.mise_en_service}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Note Conditions -->
        <div class="mt-8 p-4 border border-blue-100 bg-blue-50 rounded-lg flex items-start gap-3">
            <i class="fas fa-cloud-moon text-blue-500 mt-1"></i>
            <div class="text-xs text-blue-800">
                <strong>Conditions d'intervention :</strong><br>
                Météo: ${auditData.meteo.ciel}, Temp: ${auditData.meteo.temp}, Vent: ${auditData.meteo.vent}.<br>
                L'inspection EL a été réalisée de nuit pour garantir une qualité d'image optimale sans pollution lumineuse.
            </div>
        </div>
    </div>

    <!-- ================================================================================================ -->
    <!-- PAGE 3 : RÉSULTATS DÉTAILLÉS (La "Planche") -->
    <!-- ================================================================================================ -->
    <div class="report-page bg-white shadow-2xl print:shadow-none p-[2cm] mt-8 print:mt-0 relative">
        
        <div class="flex justify-between items-center border-b border-slate-100 pb-4 mb-8">
            <span class="text-xs font-bold text-slate-400 uppercase">Réf: ${auditData.ref}</span>
            <span class="text-xs font-bold text-slate-400">Page 3</span>
        </div>

        <h2 class="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <span class="w-8 h-8 bg-slate-900 text-white rounded flex items-center justify-center text-sm">3</span>
            Analyse des Anomalies
        </h2>

        <p class="text-slate-600 text-sm mb-8 text-justify">
            L'inspection par électroluminescence a permis de mettre en évidence des défauts invisibles à l'œil nu. 
            Voici une sélection des anomalies caractéristiques relevées sur la centrale.
        </p>

        <!-- GRILLE DE DÉFAUTS -->
        <div class="grid grid-cols-2 gap-6">
            
            ${auditData.defauts.map(d => `
            <div class="break-inside-avoid border border-slate-200 rounded-xl overflow-hidden">
                <div class="h-48 bg-slate-900 relative flex items-center justify-center">
                    <i class="fas fa-moon text-slate-600 text-4xl"></i>
                    <span class="absolute top-2 left-2 bg-black/50 text-white text-xs font-mono px-2 py-1 rounded">
                        ${d.id}
                    </span>
                    <span class="absolute top-2 right-2 bg-white text-slate-900 text-xs font-bold px-2 py-1 rounded shadow">
                        EL
                    </span>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <div class="font-bold text-slate-800 text-sm">${d.type}</div>
                        <span class="text-[10px] uppercase font-bold px-2 py-1 rounded ${d.severite === 'Critique' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}">
                            ${d.severite}
                        </span>
                    </div>
                    <p class="text-xs text-slate-500 leading-tight">
                        Impact structurel confirmé. Risque de perte de production localisée et d'évolution vers un point chaud.
                    </p>
                </div>
            </div>
            `).join('')}

        </div>

        <div class="mt-8 text-center">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full">
                <i class="fas fa-plus-circle"></i>
                Voir annexe pour la liste complète des 200+ défauts
            </div>
        </div>
    </div>

    <!-- ================================================================================================ -->
    <!-- PAGE 4 : SYNTHÈSE & CONCLUSION -->
    <!-- ================================================================================================ -->
    <div class="report-page bg-white shadow-2xl print:shadow-none p-[2cm] mt-8 print:mt-0 relative">
        
        <div class="flex justify-between items-center border-b border-slate-100 pb-4 mb-8">
            <span class="text-xs font-bold text-slate-400 uppercase">Réf: ${auditData.ref}</span>
            <span class="text-xs font-bold text-slate-400">Page 4</span>
        </div>

        <h2 class="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <span class="w-8 h-8 bg-green-600 text-white rounded flex items-center justify-center text-sm">4</span>
            Synthèse & Conclusion
        </h2>

        <!-- TABLEAU STATS -->
        <div class="mb-10">
            <h3 class="font-bold text-slate-700 uppercase text-xs tracking-wide mb-4">Répartition des défauts</h3>
            
            <div class="flex gap-4 mb-4">
                <div class="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <div class="text-3xl font-black text-slate-800">${auditData.stats.total}</div>
                    <div class="text-xs font-bold text-slate-400 uppercase">Modules Testés</div>
                </div>
                <div class="flex-1 bg-green-50 p-4 rounded-xl border border-green-200 text-center">
                    <div class="text-3xl font-black text-green-600">${auditData.stats.ok}</div>
                    <div class="text-xs font-bold text-green-700 uppercase">Conformes</div>
                </div>
                <div class="flex-1 bg-red-50 p-4 rounded-xl border border-red-200 text-center">
                    <div class="text-3xl font-black text-red-600">${auditData.stats.critique}</div>
                    <div class="text-xs font-bold text-red-700 uppercase">Critiques</div>
                </div>
            </div>

            <div class="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex">
                <div class="bg-green-500 h-full" style="width: ${(auditData.stats.ok/auditData.stats.total)*100}%"></div>
                <div class="bg-orange-400 h-full" style="width: ${(auditData.stats.mineur/auditData.stats.total)*100}%"></div>
                <div class="bg-red-500 h-full" style="width: ${(auditData.stats.critique/auditData.stats.total)*100}%"></div>
            </div>
            <div class="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                <span>Conforme</span>
                <span>Anomalies</span>
            </div>
        </div>

        <!-- AVIS D'EXPERT -->
        <div class="bg-slate-50 border-l-4 border-slate-900 p-6 rounded-r-xl mb-10">
            <h3 class="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <i class="fas fa-certificate"></i> Avis de l'expert
            </h3>
            <p class="text-slate-600 text-sm leading-relaxed text-justify mb-4">
                L'audit révèle un taux de défaillance significatif (environ ${(auditData.stats.critique/auditData.stats.total*100).toFixed(1)}% de défauts critiques) directement corrélé à l'épisode de grêle mentionné.
                Les impacts de type "X-Shape" visibles en EL confirment que les dégâts ne se limitent pas au verre mais affectent la structure des cellules.
            </p>
            <p class="text-slate-600 text-sm leading-relaxed text-justify">
                <strong>Préconisation :</strong> Le remplacement immédiat des ${auditData.stats.critique} modules critiques est impératif pour la sécurité électrique. Une surveillance accrue (monitoring string) est recommandée pour les ${auditData.stats.majeur} modules présentant des défauts majeurs.
            </p>
        </div>

        <!-- SIGNATURE -->
        <div class="flex justify-end mt-12">
            <div class="text-center">
                <div class="text-xs font-bold text-slate-400 uppercase mb-4">Pour DiagPV</div>
                <div class="font-black text-slate-900 text-lg">Fabien CORRERA</div>
                <div class="text-xs text-slate-500">Expert Photovoltaïque</div>
                <!-- Signature simulée -->
                <div class="mt-2 font-script text-3xl text-blue-900 opacity-80 rotate-[-5deg]">F. Correra</div>
            </div>
        </div>

    </div>

    <!-- STYLES -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        .font-script { font-family: 'Dancing Script', cursive; }

        .report-page {
            width: 21cm;
            height: 29.7cm;
            margin: 0 auto;
            overflow: hidden;
        }

        @media print {
            body { background: white; -webkit-print-color-adjust: exact; }
            .print\\:hidden { display: none !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:mt-0 { margin-top: 0 !important; }
            
            /* Force page breaks */
            .report-page {
                break-after: page;
                break-inside: avoid;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
            }
        }
    </style>
  `;

  return getLayout('Rapport Expert', content, 'rapports');
}
