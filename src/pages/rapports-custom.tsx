import { getLayout } from './layout.js';

export function getRapportsCustomPage() {
  const content = `
    <!-- CONTENEUR DE CHARGEMENT -->
    <div id="loading-screen" class="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <i class="fas fa-circle-notch fa-spin text-5xl text-blue-600 mb-4"></i>
        <p class="text-xl font-bold text-slate-700">Génération du Rapport Expert...</p>
        <p class="text-sm text-slate-400 mt-2">Récupération des données terrain & calcul du mapping</p>
    </div>

    <!-- CONTENU DU RAPPORT (Injecté dynamiquement) -->
    <div id="report-content" class="hidden">
        
        <!-- HEADER ACTION -->
        <div class="max-w-[21cm] mx-auto mb-6 print:hidden flex justify-between items-center bg-slate-900 p-4 rounded-xl text-white shadow-lg">
            <div>
                <h2 class="font-bold text-lg"><i class="fas fa-file-invoice mr-2"></i>Rapport Expert EL</h2>
                <p class="text-xs text-slate-400">Données Temps Réel • <span id="header-ref">Chargement...</span></p>
            </div>
            <div class="flex gap-3">
                <a href="/crm/dashboard" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition">
                    Retour Dashboard
                </a>
                <button onclick="window.print()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition shadow-lg">
                    <i class="fas fa-print mr-2"></i>Imprimer PDF
                </button>
            </div>
        </div>

        <!-- PAGE 1 : GARDE -->
        <div class="report-page bg-white relative p-[2cm] flex flex-col justify-between shadow-2xl print:shadow-none">
            <div class="border-b-4 border-green-600 pb-8">
                <div class="flex justify-between items-end">
                    <div>
                        <h1 class="text-4xl font-black text-slate-900 tracking-tighter mb-2">DIAG<span class="text-green-600">PV</span></h1>
                        <div class="text-sm font-bold text-slate-500 uppercase tracking-widest">Expertise Photovoltaïque</div>
                    </div>
                    <div class="text-6xl font-black text-slate-100" id="report-year">2025</div>
                </div>
                <div class="mt-4 text-xs text-slate-500 font-medium">3 Rue Apollo, 31240 L’UNION • 05.81.10.16.59</div>
            </div>
            <div class="text-center">
                <div class="inline-block px-8 py-3 border-2 border-slate-900 text-slate-900 font-black text-xl uppercase tracking-widest mb-12">Rapport d'Audit</div>
                <h1 class="text-6xl font-black text-slate-900 leading-tight mb-8">SITE REF :<br><span class="text-green-600" id="cover-ref">...</span></h1>
                <p class="text-xl font-bold text-slate-600 uppercase" id="cover-date">...</p>
            </div>
            <div class="border-t border-slate-100 pt-6 flex justify-between items-end">
                <div class="text-xs text-slate-400 uppercase tracking-widest font-bold">Confidentiel • <span id="cover-client">...</span></div>
                <div class="text-right">
                    <div class="text-xs text-slate-400 mb-1">Intervenants</div>
                    <div class="font-bold text-slate-800" id="cover-team">Fabien CORRERA</div>
                </div>
            </div>
        </div>

        <!-- PAGE 2 : CONTEXTE -->
        <div class="report-page bg-white relative p-[2cm] mt-8 print:mt-0 shadow-2xl print:shadow-none print:break-before-page">
            <div class="flex justify-between border-b border-slate-100 pb-4 mb-10">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider" id="p2-ref">...</span>
                <span class="text-xs font-bold text-slate-400">Page 2</span>
            </div>
            
            <h2 class="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span class="w-8 h-8 bg-slate-900 text-white rounded flex items-center justify-center text-sm">1</span>
                Contexte & Objectifs
            </h2>
            <div class="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
                <p class="text-slate-600 text-sm leading-relaxed text-justify">
                    Intervention d'audit technique sur l'installation photovoltaïque. L'objectif est de vérifier l'intégrité des cellules via électroluminescence et d'identifier les défauts thermiques potentiels.
                </p>
            </div>

            <h2 class="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span class="w-8 h-8 bg-slate-900 text-white rounded flex items-center justify-center text-sm">2</span>
                Fiche Technique
            </h2>
            <div class="overflow-hidden border border-slate-200 rounded-xl">
                <table class="w-full text-sm">
                    <tr class="border-b border-slate-100 bg-slate-50"><td class="py-3 px-4 font-bold text-slate-500 w-1/2">Puissance</td><td class="py-3 px-4 font-black text-slate-900" id="spec-power">...</td></tr>
                    <tr class="border-b border-slate-100"><td class="py-3 px-4 font-bold text-slate-500">Modules</td><td class="py-3 px-4 font-bold text-slate-800" id="spec-modules">...</td></tr>
                    <tr class="border-b border-slate-100 bg-slate-50"><td class="py-3 px-4 font-bold text-slate-500">Onduleurs</td><td class="py-3 px-4 font-bold text-slate-800" id="spec-inverters">...</td></tr>
                    <tr><td class="py-3 px-4 font-bold text-slate-500">Localisation</td><td class="py-3 px-4 font-bold text-slate-800" id="spec-location">...</td></tr>
                </table>
            </div>
        </div>

        <!-- PAGE 3 : PLAN MAPPING EL (Le Coeur) -->
        <div class="report-page bg-white relative p-[2cm] mt-8 print:mt-0 shadow-2xl print:shadow-none print:break-before-page">
            
            <div class="flex justify-between border-b border-slate-100 pb-4 mb-8">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider" id="p3-ref">...</span>
                <span class="text-xs font-bold text-slate-400">Page 3 (Cartographie)</span>
            </div>

            <h2 class="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                <span class="w-8 h-8 bg-purple-600 text-white rounded flex items-center justify-center text-sm">3</span>
                Cartographie EL & Défauts
            </h2>
            <div class="flex justify-between items-end mb-6">
                <p class="text-sm text-slate-500 pl-11">Repérage par String Électrique (Vue Technique)</p>
                <div class="flex gap-3">
                    <span class="flex items-center gap-1 text-[10px] font-bold uppercase text-red-600"><span class="w-2 h-2 bg-red-600 rounded-full"></span> Critique</span>
                    <span class="flex items-center gap-1 text-[10px] font-bold uppercase text-orange-500"><span class="w-2 h-2 bg-orange-500 rounded-full"></span> Majeur</span>
                    <span class="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400"><span class="w-2 h-2 bg-slate-200 rounded-full"></span> OK</span>
                </div>
            </div>

            <!-- ZONE DE MAPPING DYNAMIQUE -->
            <div id="mapping-container" class="min-h-[18cm]">
                <!-- INJECTÉ PAR JS -->
            </div>

            <!-- Footer Expert -->
            <div class="border-t border-slate-200 pt-4 flex items-start gap-4 mt-auto">
                <div class="flex-1">
                    <h4 class="font-bold text-sm text-slate-800 mb-1">Synthèse Automatique</h4>
                    <p class="text-xs text-slate-500 text-justify leading-relaxed italic" id="expert-note">
                        Analyse en cours...
                    </p>
                </div>
                <div class="text-right w-32">
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Validé par</div>
                    <div class="font-black text-slate-900">F. CORRERA</div>
                </div>
            </div>
        </div>

    </div>

    <!-- STYLES -->
    <style>
        .report-page { width: 21cm; height: 29.7cm; margin: 0 auto; overflow: hidden; background: white; }
        @media print {
            body { background: white; -webkit-print-color-adjust: exact; }
            .print\\:hidden { display: none !important; }
            .report-page { margin: 0; border: none; shadow: none; page-break-after: always; }
        }
    </style>

    <!-- LOGIQUE DYNAMIQUE -->
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        const SEVERITY_COLORS = {
            1: { bg: 'bg-emerald-500', border: 'border-emerald-700' },
            2: { bg: 'bg-blue-500', border: 'border-blue-700' },
            3: { bg: 'bg-yellow-400', border: 'border-yellow-600' },
            4: { bg: 'bg-orange-500', border: 'border-orange-700' },
            5: { bg: 'bg-red-600', border: 'border-red-800' },
            'OK': { bg: 'bg-white', border: 'border-slate-200' }
        };

        async function initReport() {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                // MODE DEMO (Si pas de token)
                loadMockData();
                return;
            }

            try {
                // 1. Récupérer les données réelles
                // Note: Dans un vrai déploiement, ces endpoints doivent exister.
                // Ici, on simule l'appel mais on structure la donnée comme si elle venait de la BDD
                
                // Appel API simulé pour la structure finale (votre backend Hono le gérera)
                // const res = await axios.get('/api/audit/' + token + '/report-data');
                // const data = res.data;
                
                // Pour la démo "Live" sans backend peuplé, on simule la réponse d'un audit "ZI PLANE BASSE"
                const data = getMockData(token); 
                
                renderReport(data);

            } catch (e) {
                console.error(e);
                alert("Erreur lors de la génération des données");
            }
        }

        function renderReport(data) {
            // Remplissage Textes
            document.getElementById('header-ref').textContent = data.project.ref;
            document.getElementById('cover-ref').textContent = data.project.ref;
            document.getElementById('cover-date').textContent = data.project.date;
            document.getElementById('cover-client').textContent = data.project.client;
            
            document.getElementById('p2-ref').textContent = data.project.ref;
            document.getElementById('p3-ref').textContent = data.project.ref;

            document.getElementById('spec-power').textContent = data.project.power;
            document.getElementById('spec-modules').textContent = data.project.modules_count;
            document.getElementById('spec-inverters').textContent = data.project.inverters;
            document.getElementById('spec-location').textContent = data.project.location;

            // Remplissage Mapping
            const container = document.getElementById('mapping-container');
            let html = '';

            data.tables.forEach(table => {
                let stringsHtml = '';
                
                table.strings.forEach(string => {
                    let modulesHtml = '';
                    
                    // Générer les modules du string
                    string.modules.forEach(mod => {
                        const style = SEVERITY_COLORS[mod.sev] || SEVERITY_COLORS['OK'];
                        const label = mod.code ? \`<span class="text-[5px] font-black text-white">\${mod.code}</span>\` : \`<span class="text-[5px] text-slate-300 opacity-0">\${mod.idx}</span>\`;
                        
                        modulesHtml += \`
                            <div class="w-5 h-8 \${style.bg} border \${style.border} rounded-[1px] flex items-center justify-center relative mb-[1px]">
                                \${label}
                            </div>
                        \`;
                    });

                    stringsHtml += \`
                        <div class="flex flex-col items-center mr-2">
                            <div class="text-[8px] font-bold text-slate-500 mb-1 bg-slate-100 px-1 rounded">\${string.id}</div>
                            <div class="flex flex-col p-[2px] bg-white border border-slate-200 shadow-sm rounded">
                                \${modulesHtml}
                            </div>
                        </div>
                    \`;
                });

                html += \`
                    <div class="break-inside-avoid mb-6">
                        <h4 class="font-bold text-xs text-slate-700 uppercase mb-2 border-b border-slate-200 pb-1 w-full">\${table.name}</h4>
                        <div class="flex flex-wrap items-start">
                            \${stringsHtml}
                        </div>
                    </div>
                \`;
            });

            container.innerHTML = html;

            // Stats Note
            const critCount = data.stats.critical;
            document.getElementById('expert-note').innerHTML = \`
                L'audit a révélé <strong>\${critCount} défauts critiques</strong> nécessitant une intervention. 
                La cartographie met en évidence une concentration sur la \${data.tables[0].name}, suggérant un problème localisé (ombrage ou défaut série).
            \`;

            // Afficher
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('report-content').classList.remove('hidden');
        }

        function getMockData(token) {
            // Simulation intelligente basée sur le token
            return {
                project: {
                    ref: "ZI PLANE BASSE (AUDIT-" + token.substring(0,4) + ")",
                    client: "SOLAR SUD",
                    date: new Date().toLocaleDateString('fr-FR'),
                    power: "1337.5 kWc",
                    modules_count: "3850",
                    inverters: "12x Huawei 100KTL",
                    location: "81660 Bout-du-Pont-de-Larn"
                },
                stats: { critical: 5 },
                tables: [
                    {
                        name: "Zone 1 - Onduleur A",
                        strings: [
                            { id: "S.01", modules: Array.from({length:20}, (_,i) => ({idx:i+1, sev: i===4?5:'OK', code: i===4?'HOT':null})) },
                            { id: "S.02", modules: Array.from({length:20}, (_,i) => ({idx:i+1, sev: 'OK'})) },
                            { id: "S.03", modules: Array.from({length:20}, (_,i) => ({idx:i+1, sev: i>15?3:'OK', code: i>15?'PID':null})) },
                        ]
                    },
                    {
                        name: "Zone 1 - Onduleur B",
                        strings: [
                            { id: "S.04", modules: Array.from({length:20}, (_,i) => ({idx:i+1, sev: 'OK'})) },
                            { id: "S.05", modules: Array.from({length:20}, (_,i) => ({idx:i+1, sev: 5, code: 'CAS'})) }, // String completement rouge simulé
                        ]
                    }
                ]
            };
        }

        // Load
        window.addEventListener('DOMContentLoaded', initReport);
    </script>
  `;

  return getLayout('Rapport Dynamique', content, 'rapports');
}
