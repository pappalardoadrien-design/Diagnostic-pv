/**
 * Page Repowering - Gestion missions
 * /repowering
 */
export function getRepoweringPage(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Repowering PV — DiagPV</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>body{font-family:'Inter',sans-serif}.phase-badge{font-size:11px;padding:2px 10px;border-radius:9999px;font-weight:600}</style>
</head>
<body class="bg-gray-50 min-h-screen">
  <nav class="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/crm/dashboard" class="text-white/70 hover:text-white"><i class="fas fa-arrow-left mr-2"></i>Dashboard</a>
      <h1 class="text-lg font-bold"><i class="fas fa-solar-panel mr-2"></i>Repowering PV</h1>
    </div>
    <button onclick="showCreate()" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold"><i class="fas fa-plus mr-1"></i>Nouvelle Mission</button>
  </nav>

  <div class="p-6">
    <!-- KPIs -->
    <div id="kpis" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Missions actives</div><div id="k-active" class="text-2xl font-bold text-orange-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">CA total devis</div><div id="k-ca" class="text-2xl font-bold text-green-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">CA actif</div><div id="k-active-ca" class="text-2xl font-bold text-blue-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Terminées</div><div id="k-done" class="text-2xl font-bold text-slate-600">—</div></div>
    </div>

    <!-- Liste missions -->
    <div class="bg-white rounded-xl shadow-sm border">
      <div class="p-4 border-b flex items-center justify-between">
        <h2 class="font-bold text-gray-800"><i class="fas fa-list mr-2"></i>Missions Repowering</h2>
        <select id="filter-phase" onchange="loadMissions()" class="border rounded-lg px-3 py-1 text-sm">
          <option value="">Toutes phases</option>
          <option value="diagnostic">Diagnostic</option><option value="etude">Étude</option>
          <option value="devis">Devis</option><option value="validation">Validation</option>
          <option value="travaux">Travaux</option><option value="reception">Réception</option><option value="cloture">Clôture</option>
        </select>
      </div>
      <div id="missions-list" class="divide-y"></div>
      <div id="empty-state" class="hidden p-12 text-center text-gray-400">
        <i class="fas fa-solar-panel text-4xl mb-3"></i>
        <p class="font-semibold">Aucune mission repowering</p>
        <p class="text-sm mt-1">Créez votre première mission pour commencer</p>
      </div>
    </div>
  </div>

  <!-- Modal Créer -->
  <div id="modal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-5 border-b flex justify-between"><h2 class="font-bold">Nouvelle Mission Repowering</h2><button onclick="closeModal()"><i class="fas fa-times text-gray-400"></i></button></div>
      <form id="form" class="p-5 space-y-3" onsubmit="saveMission(event)">
        <div><label class="text-sm font-medium text-gray-700">Titre *</label><input id="f-title" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="Ex: Repowering centrale JALIBAT 100kWc"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-sm font-medium text-gray-700">Client</label><select id="f-client" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></select></div>
          <div><label class="text-sm font-medium text-gray-700">Puissance (kWc)</label><input id="f-power" type="number" step="0.1" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-sm font-medium text-gray-700">Nom centrale</label><input id="f-plant" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
          <div><label class="text-sm font-medium text-gray-700">Localisation</label><input id="f-loc" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-sm font-medium text-gray-700">Âge (ans)</label><input id="f-age" type="number" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
          <div><label class="text-sm font-medium text-gray-700">Coût estimé (€)</label><input id="f-cost" type="number" step="100" class="w-full border rounded-lg px-3 py-2 text-sm mt-1"></div>
        </div>
        <div><label class="text-sm font-medium text-gray-700">Périmètre travaux</label><textarea id="f-scope" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="Remplacement modules, onduleurs..."></textarea></div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2 border rounded-lg text-sm">Annuler</button>
          <button type="submit" class="bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-semibold">Créer</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const API = '/api/repowering';
    const phaseColors = {diagnostic:'#6b7280',etude:'#3b82f6',devis:'#f59e0b',validation:'#8b5cf6',travaux:'#ec4899',reception:'#10b981',cloture:'#14b8a6'};
    function fmt(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0);}

    async function loadKPIs(){
      try{const r=await fetch(API+'/kpis');const d=await r.json();
      document.getElementById('k-active').textContent=d.kpis.active_count||0;
      document.getElementById('k-ca').textContent=fmt(d.kpis.total_ca);
      document.getElementById('k-active-ca').textContent=fmt(d.kpis.active_ca);
      document.getElementById('k-done').textContent=d.kpis.completed_count||0;
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
        list.innerHTML=d.missions.map(m=>'<div class="p-4 hover:bg-gray-50 flex items-center justify-between"><div class="flex-1"><div class="flex items-center gap-2 mb-1"><span class="font-semibold text-sm">'+m.title+'</span><span class="phase-badge" style="background:'+((phaseColors[m.phase]||'#666')+'20')+';color:'+(phaseColors[m.phase]||'#666')+'">'+m.phase+'</span></div><div class="text-xs text-gray-500">'+((m.client_name||'—')+' • '+(m.plant_name||'—')+' • '+(m.plant_power_kwp?m.plant_power_kwp+'kWc':'—'))+'</div></div><div class="text-right"><div class="font-bold text-sm">'+fmt(m.devis_amount||m.estimated_cost)+'</div><div class="text-xs text-gray-400">'+m.reference+'</div></div></div>').join('');
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
      const body={title:document.getElementById('f-title').value,client_id:parseInt(document.getElementById('f-client').value)||null,plant_power_kwp:parseFloat(document.getElementById('f-power').value)||null,plant_name:document.getElementById('f-plant').value||null,plant_location:document.getElementById('f-loc').value||null,plant_age_years:parseInt(document.getElementById('f-age').value)||null,estimated_cost:parseFloat(document.getElementById('f-cost').value)||0,scope_of_work:document.getElementById('f-scope').value||null};
      await fetch(API+'/missions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      closeModal();loadMissions();loadKPIs();
    }

    loadClients();loadKPIs();loadMissions();
  </script>
</body>
</html>`;
}
