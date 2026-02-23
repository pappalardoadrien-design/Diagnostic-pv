/**
 * Page Rapport Audit Qualité - Version imprimable
 * Route: /rapport-qualite/:rapport_id
 * 
 * Charge les données via API et génère un rapport HTML complet
 * optimisé pour l'impression (Ctrl+P)
 */

export function getRapportQualitePage(rapportId: string) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Audit Qualité - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        @media print {
            body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }
            @page { margin: 15mm; size: A4 portrait; }
        }
        .report-section { page-break-inside: avoid; }
        .score-badge { font-variant-numeric: tabular-nums; }
    </style>
</head>
<body class="bg-slate-100 min-h-screen">
    
    <!-- Toolbar (non imprimée) -->
    <div class="no-print sticky top-0 z-50 bg-white shadow-md px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <button onclick="history.back()" class="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100">
                <i class="fas fa-arrow-left"></i>
            </button>
            <span class="font-bold text-slate-700">Rapport Audit Qualité</span>
            <span class="text-xs text-slate-400" id="toolbar-ref"></span>
        </div>
        <div class="flex gap-2">
            <button onclick="window.print()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2">
                <i class="fas fa-print"></i> Imprimer / PDF
            </button>
            <button onclick="validerRapport()" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition flex items-center gap-2" id="btn-valider">
                <i class="fas fa-check-circle"></i> Valider
            </button>
        </div>
    </div>

    <!-- Contenu rapport -->
    <div class="max-w-[210mm] mx-auto bg-white shadow-xl my-4 print:my-0 print:shadow-none" id="report-container">
        <div class="p-8 text-center">
            <i class="fas fa-circle-notch fa-spin text-3xl text-blue-500 mb-4"></i>
            <p class="text-slate-400">Chargement du rapport...</p>
        </div>
    </div>

    <script>
    const RAPPORT_ID = '${rapportId}';
    const API = '/api/audit-qualite';

    async function loadReport() {
        try {
            const res = await axios.get(API + '/rapports/' + RAPPORT_ID);
            if (!res.data.success) throw new Error('Données invalides');
            
            const { rapport, mission, items_sol, items_toiture, commentaire, photos_generales, complements } = res.data;
            
            document.getElementById('toolbar-ref').textContent = rapport.reference || '';
            if (rapport.statut === 'valide') {
                document.getElementById('btn-valider').style.display = 'none';
            }
            
            renderReport(rapport, mission, items_sol, items_toiture, commentaire, photos_generales);
        } catch (err) {
            console.error('Erreur chargement rapport:', err);
            document.getElementById('report-container').innerHTML = 
                '<div class="p-8 text-center"><i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i><p class="text-red-500 font-bold">Erreur de chargement</p><p class="text-slate-400 text-sm mt-2">' + err.message + '</p></div>';
        }
    }

    function renderReport(rapport, mission, itemsSol, itemsToiture, commentaire, photosGen) {
        const allItems = [...(itemsSol || []), ...(itemsToiture || [])];
        const total = allItems.length;
        const conformes = allItems.filter(i => i.conformite === 'conforme').length;
        const nc = allItems.filter(i => i.conformite === 'non_conforme').length;
        const obs = allItems.filter(i => i.conformite === 'observation').length;
        const na = allItems.filter(i => i.conformite === 'non_applicable').length;
        const nv = allItems.filter(i => i.conformite === 'non_verifie').length;
        const applicable = total - na - nv;
        const scorePct = applicable > 0 ? Math.round((conformes / applicable) * 100) : 0;

        const scoreColor = scorePct >= 80 ? '#22c55e' : scorePct >= 60 ? '#f59e0b' : '#ef4444';
        const scoreLabel = scorePct >= 80 ? 'CONFORME' : scorePct >= 60 ? 'PARTIELLEMENT CONFORME' : 'NON CONFORME';

        let html = '';

        // === PAGE 1: EN-TÊTE ===
        html += '<div class="p-8 pb-4">';
        
        // Header DiagPV
        html += '<div class="flex justify-between items-start mb-8 border-b-4 border-emerald-600 pb-6">';
        html += '<div>';
        html += '<h1 class="text-2xl font-black text-slate-900">DIAGNOSTIC PHOTOVOLTAIQUE</h1>';
        html += '<p class="text-sm text-slate-500 font-medium">L\\'expertise photovoltaique independante depuis 2012</p>';
        html += '<p class="text-xs text-slate-400 mt-1">3 rue Apollo, 31240 L\\'Union | contact@diagpv.fr</p>';
        html += '</div>';
        html += '<div class="text-right">';
        html += '<div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rapport d\\'Audit</div>';
        html += '<div class="text-lg font-black text-emerald-600">' + (rapport.reference || 'RAQ-XXX') + '</div>';
        html += '<div class="text-xs text-slate-400">Version ' + (rapport.version || 1) + ' - ' + new Date(rapport.created_at || Date.now()).toLocaleDateString('fr-FR') + '</div>';
        html += '</div>';
        html += '</div>';

        // Titre rapport
        html += '<div class="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl p-6 mb-6">';
        html += '<h2 class="text-xl font-black mb-2">RAPPORT D\\'AUDIT QUALITE TERRAIN</h2>';
        html += '<p class="text-sm opacity-90">' + (mission?.project_name || 'Centrale PV') + '</p>';
        html += '<div class="flex gap-6 mt-3 text-sm">';
        html += '<span><i class="fas fa-building mr-1"></i>' + (mission?.client_name || '-') + '</span>';
        html += '<span><i class="fas fa-tag mr-1"></i>' + (mission?.type_audit || 'SOL') + '</span>';
        html += '<span><i class="fas fa-bolt mr-1"></i>' + (mission?.power_kwc ? mission.power_kwc + ' kWc' : '-') + '</span>';
        html += '</div>';
        html += '</div>';

        // Infos mission
        html += '<div class="grid grid-cols-2 gap-4 mb-6 report-section">';
        html += '<div class="bg-slate-50 rounded-lg p-4">';
        html += '<h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Informations Mission</h3>';
        html += '<table class="w-full text-sm">';
        html += '<tr><td class="py-1 text-slate-500 font-medium">Reference</td><td class="py-1 font-bold text-slate-800">' + (mission?.reference || '-') + '</td></tr>';
        html += '<tr><td class="py-1 text-slate-500 font-medium">Date planifiee</td><td class="py-1 font-bold text-slate-800">' + (mission?.date_planifiee ? new Date(mission.date_planifiee).toLocaleDateString('fr-FR') : '-') + '</td></tr>';
        html += '<tr><td class="py-1 text-slate-500 font-medium">Technicien</td><td class="py-1 font-bold text-slate-800">' + (mission?.technicien_name || 'Adrien PAPPALARDO') + '</td></tr>';
        html += '<tr><td class="py-1 text-slate-500 font-medium">Sous-traitant</td><td class="py-1 font-bold text-slate-800">' + (mission?.sous_traitant_name || 'DiagPV (interne)') + '</td></tr>';
        html += '</table></div>';
        
        html += '<div class="bg-slate-50 rounded-lg p-4">';
        html += '<h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Conditions Terrain</h3>';
        html += '<table class="w-full text-sm">';
        html += '<tr><td class="py-1 text-slate-500 font-medium">Localisation</td><td class="py-1 font-bold text-slate-800">' + (mission?.project_location || '-') + '</td></tr>';
        html += '<tr><td class="py-1 text-slate-500 font-medium">Meteo</td><td class="py-1 font-bold text-slate-800">' + (mission?.meteo || '-') + '</td></tr>';
        html += '<tr><td class="py-1 text-slate-500 font-medium">Temperature</td><td class="py-1 font-bold text-slate-800">' + (mission?.temperature_ambiante ? mission.temperature_ambiante + ' C' : '-') + '</td></tr>';
        html += '<tr><td class="py-1 text-slate-500 font-medium">Irradiance</td><td class="py-1 font-bold text-slate-800">' + (mission?.irradiance ? mission.irradiance + ' W/m2' : '-') + '</td></tr>';
        html += '</table></div>';
        html += '</div>';

        // === SCORE GLOBAL ===
        html += '<div class="report-section bg-white border-2 rounded-xl p-6 mb-6 text-center" style="border-color: ' + scoreColor + '">';
        html += '<h3 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Score de Conformite Global</h3>';
        html += '<div class="text-6xl font-black mb-2 score-badge" style="color: ' + scoreColor + '">' + scorePct + '%</div>';
        html += '<div class="text-lg font-black px-4 py-2 rounded-full inline-block" style="background: ' + scoreColor + '20; color: ' + scoreColor + '">' + scoreLabel + '</div>';
        html += '<div class="grid grid-cols-5 gap-3 mt-6 text-center">';
        html += '<div><div class="text-xl font-black text-green-600">' + conformes + '</div><div class="text-[10px] text-slate-400 font-bold uppercase">Conformes</div></div>';
        html += '<div><div class="text-xl font-black text-red-600">' + nc + '</div><div class="text-[10px] text-slate-400 font-bold uppercase">Non-Conf.</div></div>';
        html += '<div><div class="text-xl font-black text-amber-500">' + obs + '</div><div class="text-[10px] text-slate-400 font-bold uppercase">Observations</div></div>';
        html += '<div><div class="text-xl font-black text-slate-400">' + na + '</div><div class="text-[10px] text-slate-400 font-bold uppercase">N/A</div></div>';
        html += '<div><div class="text-xl font-black text-slate-300">' + nv + '</div><div class="text-[10px] text-slate-400 font-bold uppercase">Non Verif.</div></div>';
        html += '</div></div>';

        // === CHECKLIST SOL ===
        if (itemsSol && itemsSol.length > 0) {
            html += '<div class="page-break"></div>';
            html += '<div class="p-8 pt-4">';
            html += '<h2 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><i class="fas fa-solar-panel text-emerald-600"></i>Checklist Conformite SOL - NF C 15-100</h2>';
            html += renderChecklistTable(itemsSol);
            html += '</div>';
        }

        // === CHECKLIST TOITURE ===
        if (itemsToiture && itemsToiture.length > 0) {
            html += '<div class="page-break"></div>';
            html += '<div class="p-8 pt-4">';
            html += '<h2 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><i class="fas fa-home text-orange-600"></i>Checklist Toiture - DTU 40.35</h2>';
            html += renderChecklistTable(itemsToiture);
            html += '</div>';
        }

        // === COMMENTAIRES FINAUX ===
        if (commentaire) {
            html += '<div class="page-break"></div>';
            html += '<div class="p-8 pt-4 report-section">';
            html += '<h2 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><i class="fas fa-clipboard-check text-emerald-600"></i>Conclusion & Recommandations</h2>';
            if (commentaire.conclusion_generale) {
                html += '<div class="bg-slate-50 rounded-lg p-4 mb-4"><h4 class="text-xs font-black text-slate-400 uppercase mb-2">Conclusion Generale</h4><p class="text-sm text-slate-700 whitespace-pre-line">' + commentaire.conclusion_generale + '</p></div>';
            }
            if (commentaire.recommandations) {
                html += '<div class="bg-amber-50 rounded-lg p-4 mb-4 border border-amber-200"><h4 class="text-xs font-black text-amber-600 uppercase mb-2">Recommandations</h4><p class="text-sm text-slate-700 whitespace-pre-line">' + commentaire.recommandations + '</p></div>';
            }
            if (commentaire.signe_par) {
                html += '<div class="mt-6 pt-4 border-t border-slate-200 flex justify-between items-end">';
                html += '<div><div class="text-xs text-slate-400">Signe par</div><div class="text-sm font-black text-slate-800">' + commentaire.signe_par + '</div>';
                if (commentaire.signe_le) html += '<div class="text-xs text-slate-400">' + new Date(commentaire.signe_le).toLocaleString('fr-FR') + '</div>';
                html += '</div>';
                html += '<div class="text-right"><div class="text-xs text-slate-400">Cachet</div><div class="text-sm font-bold text-emerald-600">DIAGNOSTIC PHOTOVOLTAIQUE</div><div class="text-xs text-slate-400">RCS 792972309</div></div>';
                html += '</div>';
            }
            html += '</div>';
        }

        // === FOOTER ===
        html += '<div class="p-8 pt-4 border-t-2 border-slate-200 mt-4">';
        html += '<div class="text-center text-xs text-slate-400">';
        html += '<p class="font-bold">Diagnostic Photovoltaique - 3 rue Apollo, 31240 L\\'Union</p>';
        html += '<p>RCS 792972309 | contact@diagpv.fr | www.diagnosticphotovoltaique.fr</p>';
        html += '<p class="mt-2 italic">Ce rapport est strictement confidentiel et destine exclusivement au donneur d\\'ordre.</p>';
        html += '</div></div>';

        html += '</div>'; // close first page div

        document.getElementById('report-container').innerHTML = html;
    }

    function renderChecklistTable(items) {
        const categories = {};
        items.forEach(i => {
            if (!categories[i.categorie]) categories[i.categorie] = [];
            categories[i.categorie].push(i);
        });

        const catLabels = {
            modules: 'Modules PV', cablage: 'Cablage', protection: 'Protections', structure: 'Structure',
            etiquetage: 'Etiquetage', onduleur: 'Onduleur', mise_terre: 'Mise a la Terre',
            etancheite: 'Etancheite', fixation: 'Fixations', ventilation: 'Ventilation',
            protection_incendie: 'Protection Incendie', acces_securite: 'Acces & Securite'
        };

        const conformiteIcons = {
            conforme: '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs"><i class="fas fa-check"></i></span>',
            non_conforme: '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs"><i class="fas fa-times"></i></span>',
            observation: '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs"><i class="fas fa-eye"></i></span>',
            non_applicable: '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-white text-xs">N/A</span>',
            non_verifie: '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-400 text-xs">-</span>'
        };

        let html = '<div class="space-y-4">';
        
        for (const [cat, catItems] of Object.entries(categories)) {
            html += '<div class="avoid-break">';
            html += '<div class="bg-slate-100 rounded-t-lg px-4 py-2"><span class="text-xs font-black text-slate-600 uppercase tracking-widest">' + (catLabels[cat] || cat) + '</span></div>';
            html += '<table class="w-full text-sm border border-slate-200 border-t-0">';
            
            catItems.forEach(item => {
                const rowBg = item.conformite === 'non_conforme' ? 'bg-red-50' : item.conformite === 'observation' ? 'bg-amber-50' : '';
                html += '<tr class="border-b border-slate-100 ' + rowBg + '">';
                html += '<td class="py-2 px-3 w-16 text-center">' + (conformiteIcons[item.conformite] || '-') + '</td>';
                html += '<td class="py-2 px-2 w-20"><span class="text-[10px] font-black text-slate-400">' + item.code_item + '</span></td>';
                html += '<td class="py-2 px-2"><span class="text-xs text-slate-700">' + item.libelle + '</span>';
                if (item.commentaire) html += '<br/><span class="text-[10px] text-amber-600 italic"><i class="fas fa-comment-dots mr-1"></i>' + item.commentaire + '</span>';
                html += '</td>';
                html += '<td class="py-2 px-2 w-32 text-right"><span class="text-[10px] text-slate-400">' + (item.norme_reference || '') + '</span></td>';
                html += '</tr>';
            });
            
            html += '</table></div>';
        }
        
        html += '</div>';
        return html;
    }

    async function validerRapport() {
        if (!confirm('Valider definitivement ce rapport ?')) return;
        try {
            await axios.put(API + '/rapports/' + RAPPORT_ID + '/valider', { valide_par: 'Adrien PAPPALARDO' });
            document.getElementById('btn-valider').style.display = 'none';
            alert('Rapport valide avec succes');
            loadReport();
        } catch (err) {
            alert('Erreur validation: ' + err.message);
        }
    }

    document.addEventListener('DOMContentLoaded', loadReport);
    </script>
</body>
</html>`;
}
