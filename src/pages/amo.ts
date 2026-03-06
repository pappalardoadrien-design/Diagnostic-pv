/**
 * Page AMO - Assistance Maîtrise d'Ouvrage
 * /amo
 */
export function getAmoPage(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AMO — DiagPV</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>body{font-family:'Inter',sans-serif}.phase-badge{font-size:11px;padding:2px 10px;border-radius:9999px;font-weight:600}</style>
</head>
<body class="bg-gray-50 min-h-screen">
  <nav class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/crm/dashboard" class="text-white/70 hover:text-white"><i class="fas fa-arrow-left mr-2"></i>Dashboard</a>
      <h1 class="text-lg font-bold"><i class="fas fa-hard-hat mr-2"></i>AMO — Assistance Maîtrise d'Ouvrage</h1>
    </div>
    <button onclick="showCreate()" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold"><i class="fas fa-plus mr-1"></i>Nouvelle Mission</button>
  </nav>

  <div class="p-6">
    <!-- KPIs -->
    <div id="kpis" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Missions actives</div><div id="k-active" class="text-2xl font-bold text-indigo-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">CA contractualisé</div><div id="k-ca" class="text-2xl font-bold text-green-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Facturé</div><div id="k-inv" class="text-2xl font-bold text-blue-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Reste à facturer</div><div id="k-remain" class="text-2xl font-bold text-amber-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Total missions</div><div id="k-total" class="text-2xl font-bold text-slate-600">—</div></div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Missions -->
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="font-bold text-gray-800"><i class="fas fa-clipboard-list mr-2"></i>Missions AMO</h2>
          <select id="filter-phase" onchange="loadMissions()" class="border rounded-lg px-3 py-1 text-sm">
            <option value="">Toutes phases</option>
            <option value="cadrage">Cadrage</option><option value="consultation">Consultation</option>
            <option value="selection">Sélection</option><option value="suivi_travaux">Suivi Travaux</option>
            <option value="reception">Réception</option><option value="garantie">Garantie</option><option value="cloture">Clôture</option>
          </select>
        </div>
        <div id="missions-list" class="divide-y"></div>
        <div id="empty-state" class="hidden p-12 text-center text-gray-400">
          <i class="fas fa-hard-hat text-4xl mb-3"></i><p class="font-semibold">Aucune mission AMO</p>
        </div>
      </div>

      <!-- Prochains jalons -->
      <div class="bg-white rounded-xl shadow-sm border">
        <div class="p-4 border-b"><h2 class="font-bold text-gray-800"><i class="fas fa-flag-checkered mr-2"></i>Prochains Jalons</h2></div>
        <div id="milestones-list" class="divide-y"></div>
        <div id="ms-empty" class="hidden p-8 text-center text-gray-400 text-sm">Aucun jalon à venir</div>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <div id="modal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-5 border-b flex justify-between"><h2 class="font-bold">Nouvelle Mission AMO</h2><button onclick="closeModal()"><i class="fas fa-times text-gray-400"></i></button></div>
      <form id="form" class="p-5 space-y-3" onsubmit="saveMission(event)">
        <div><label class="text-sm font-medium text-gray-700">Titre *</label><input id="f-title" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="Ex: AMO construction centrale 500kWc"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-sm font-medium text-gray-700">Client</label><select id="f-client" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></select></div>
          <div><label class="text-sm font-medium text-gray-700">Type projet</label>
            <select id="f-type" class="w-full border rounded-lg px-3 py-2 text-sm mt-1">
              <option value="neuf">Neuf</option><option value="renovation">Rénovation</option><option value="extension">Extension</option><option value="repowering">Repowering</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-sm font-medium text-gray-700">Puissance cible (kWc)</label><input id="f-power" type="number" step="0.1" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
          <div><label class="text-sm font-medium text-gray-700">Montant contrat (€)</label><input id="f-amount" type="number" step="100" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-sm font-medium text-gray-700">Date début</label><input id="f-start" type="date" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
          <div><label class="text-sm font-medium text-gray-700">Date fin prévue</label><input id="f-end" type="date" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
        </div>
        <div><label class="text-sm font-medium text-gray-700">Périmètre mission</label><textarea id="f-scope" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="Rédaction CCTP, analyse offres, suivi travaux..."></textarea></div>
        <div><label class="text-sm font-medium text-gray-700">Livrables</label><textarea id="f-deliverables" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="CCTP, grille analyse, PV réception, rapport final"></textarea></div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2 border rounded-lg text-sm">Annuler</button>
          <button type="submit" class="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold">Créer</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const API='/api/amo';
    const phaseColors={cadrage:'#6b7280',consultation:'#3b82f6',selection:'#f59e0b',suivi_travaux:'#8b5cf6',reception:'#10b981',garantie:'#14b8a6',cloture:'#64748b'};
    function fmt(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0);}

    async function loadKPIs(){
      try{const r=await fetch(API+'/kpis');const d=await r.json();
      document.getElementById('k-active').textContent=d.kpis.active_count||0;
      document.getElementById('k-ca').textContent=fmt(d.kpis.total_ca);
      document.getElementById('k-inv').textContent=fmt(d.kpis.invoiced);
      document.getElementById('k-remain').textContent=fmt(d.kpis.remaining_to_invoice);
      document.getElementById('k-total').textContent=d.kpis.total_missions||0;

      const msList=document.getElementById('milestones-list');
      const msEmpty=document.getElementById('ms-empty');
      if(!d.upcoming_milestones||d.upcoming_milestones.length===0){msList.innerHTML='';msEmpty.classList.remove('hidden');}
      else{msEmpty.classList.add('hidden');msList.innerHTML=d.upcoming_milestones.map(ms=>'<div class="p-3"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full '+(ms.status==='en_cours'?'bg-blue-500':'bg-gray-300')+'"></span><span class="text-sm font-medium">'+ms.title+'</span></div><div class="text-xs text-gray-500 ml-4">'+(ms.mission_title||'')+(ms.due_date?' • '+ms.due_date:'')+'</div></div>').join('');}
      }catch(e){console.error(e);}
    }

    async function loadMissions(){
      try{
        const phase=document.getElementById('filter-phase').value;
        const r=await fetch(API+'/missions'+(phase?'?phase='+phase:''));
        const d=await r.json();
        const list=document.getElementById('missions-list');
        const empty=document.getElementById('empty-state');
        if(!d.missions||d.missions.length===0){list.innerHTML='';empty.classList.remove('hidden');return;}
        empty.classList.add('hidden');
        list.innerHTML=d.missions.map(m=>{
          const pct=m.progress_percent||0;
          return '<div class="p-4 hover:bg-gray-50"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><span class="font-semibold text-sm">'+m.title+'</span><span class="phase-badge" style="background:'+((phaseColors[m.phase]||'#666')+'20')+';color:'+(phaseColors[m.phase]||'#666')+'">'+m.phase+'</span></div><span class="font-bold text-sm">'+fmt(m.contract_amount)+'</span></div><div class="flex items-center gap-4 text-xs text-gray-500"><span>'+(m.client_name||'—')+'</span><span>'+(m.target_power_kwp?m.target_power_kwp+'kWc':'—')+'</span><span>'+m.reference+'</span><span>'+(m.total_milestones?m.completed_milestones+'/'+m.total_milestones+' jalons':'0 jalons')+'</span></div><div class="mt-2 h-1.5 bg-gray-200 rounded-full"><div class="h-full bg-indigo-500 rounded-full" style="width:'+pct+'%"></div></div></div>';
        }).join('');
      }catch(e){console.error(e);}
    }

    async function loadClients(){
      try{const r=await fetch('/api/crm/clients');const d=await r.json();
      document.getElementById('f-client').innerHTML='<option value="">—</option>'+(d.clients||[]).map(c=>'<option value="'+c.id+'">'+c.company_name+'</option>').join('');
      }catch(e){}
    }

    function showCreate(){document.getElementById('form').reset();document.getElementById('modal').classList.remove('hidden');}
    function closeModal(){document.getElementById('modal').classList.add('hidden');}

    async function saveMission(e){
      e.preventDefault();
      const body={title:document.getElementById('f-title').value,client_id:parseInt(document.getElementById('f-client').value)||null,project_type:document.getElementById('f-type').value,target_power_kwp:parseFloat(document.getElementById('f-power').value)||null,contract_amount:parseFloat(document.getElementById('f-amount').value)||0,start_date:document.getElementById('f-start').value||null,end_date:document.getElementById('f-end').value||null,mission_scope:document.getElementById('f-scope').value||null,deliverables:document.getElementById('f-deliverables').value||null};
      await fetch(API+'/missions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      closeModal();loadMissions();loadKPIs();
    }

    loadClients();loadKPIs();loadMissions();
  </script>
</body>
</html>`;
}
