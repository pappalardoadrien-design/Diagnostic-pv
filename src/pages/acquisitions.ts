/**
 * Page Acquisitions/Cessions - Deal Flow Centrales PV
 * /acquisitions
 */
export function getAcquisitionsPage(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acquisitions/Cessions — DiagPV</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>body{font-family:'Inter',sans-serif}.phase-badge{font-size:11px;padding:2px 10px;border-radius:9999px;font-weight:600}</style>
</head>
<body class="bg-gray-50 min-h-screen">
  <nav class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/crm/dashboard" class="text-white/70 hover:text-white"><i class="fas fa-arrow-left mr-2"></i>Dashboard</a>
      <h1 class="text-lg font-bold"><i class="fas fa-exchange-alt mr-2"></i>Acquisitions / Cessions Centrales PV</h1>
    </div>
    <button onclick="showCreate()" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold"><i class="fas fa-plus mr-1"></i>Nouveau Deal</button>
  </nav>

  <div class="p-6">
    <!-- KPIs -->
    <div id="kpis" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Deals actifs</div><div id="k-active" class="text-2xl font-bold text-emerald-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Valeur totale</div><div id="k-value" class="text-2xl font-bold text-green-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Commissions estimees</div><div id="k-commission" class="text-2xl font-bold text-blue-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Closings ce mois</div><div id="k-closings" class="text-2xl font-bold text-amber-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Total deals</div><div id="k-total" class="text-2xl font-bold text-slate-600">—</div></div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Deals -->
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="font-bold text-gray-800"><i class="fas fa-handshake mr-2"></i>Deal Flow</h2>
          <select id="filter-type" onchange="loadDeals()" class="border rounded-lg px-3 py-1 text-sm">
            <option value="">Tous types</option>
            <option value="acquisition">Acquisition</option>
            <option value="cession">Cession</option>
            <option value="transfert">Transfert</option>
          </select>
        </div>
        <div id="deals-list" class="divide-y max-h-[600px] overflow-y-auto">
          <div class="p-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Chargement...</div>
        </div>
      </div>

      <!-- Phases Pipeline -->
      <div class="bg-white rounded-xl shadow-sm border">
        <div class="p-4 border-b"><h2 class="font-bold text-gray-800"><i class="fas fa-chart-bar mr-2"></i>Par Phase</h2></div>
        <div id="phases" class="p-4 space-y-2"></div>
      </div>
    </div>
  </div>

  <!-- Modal Creation -->
  <div id="modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b flex justify-between items-center">
        <h2 class="text-lg font-bold">Nouveau Deal</h2>
        <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <form id="deal-form" class="p-6 space-y-4" onsubmit="saveDeal(event)">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Nom du deal *</label><input id="d-name" required class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ex: Centrale Montauban 500kWc"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select id="d-type" required class="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="acquisition">Acquisition</option>
              <option value="cession">Cession</option>
              <option value="transfert">Transfert</option>
            </select>
          </div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Puissance (kWc)</label><input id="d-power" type="number" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Valeur estimee (EUR)</label><input id="d-value" type="number" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label><input id="d-commission" type="number" step="0.1" value="3" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
          <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Localisation</label><input id="d-location" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
          <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea id="d-notes" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm"></textarea></div>
        </div>
        <button type="submit" class="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700"><i class="fas fa-save mr-1"></i>Creer le deal</button>
      </form>
    </div>
  </div>

<script>
const API = '/api/acquisitions';
const PHASES = {sourcing:'Sourcing',due_diligence:'Due Diligence',negociation:'Negociation',closing:'Closing',post_closing:'Post-Closing',cloture:'Cloture'};
const PHASE_COLORS = {sourcing:'bg-gray-100 text-gray-700',due_diligence:'bg-blue-100 text-blue-700',negociation:'bg-amber-100 text-amber-700',closing:'bg-green-100 text-green-700',post_closing:'bg-purple-100 text-purple-700',cloture:'bg-slate-100 text-slate-700'};

function fmt(n){return n?new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n):'—'}

async function loadKPIs(){
  try{const r=await fetch(API+'/kpis');const d=await r.json();if(d.success){const k=d.kpis;
    el('k-active').textContent=k.active_count||0;
    el('k-value').textContent=fmt(k.total_value);
    el('k-commission').textContent=fmt(k.total_commission);
    el('k-closings').textContent=k.closings_this_month||0;
    el('k-total').textContent=k.total_deals||0;
    if(d.by_phase){let h='';d.by_phase.forEach(p=>{h+=\`<div class="flex items-center justify-between py-2"><span class="phase-badge \${PHASE_COLORS[p.phase]||''}">\${PHASES[p.phase]||p.phase}</span><span class="font-semibold">\${p.count}</span></div>\`});el('phases').innerHTML=h||'<p class="text-gray-400 text-sm">Aucun deal</p>';}
  }}catch(e){console.error(e)}
}

async function loadDeals(){
  try{const type=el('filter-type').value;let url=API+'/deals?limit=50';if(type)url+='&type='+type;
    const r=await fetch(url);const d=await r.json();
    if(d.success&&d.deals.length>0){
      el('deals-list').innerHTML=d.deals.map(dl=>\`<div class="p-4 hover:bg-gray-50 cursor-pointer">
        <div class="flex justify-between items-start">
          <div><div class="font-semibold text-gray-800">\${dl.deal_name||dl.reference}</div>
          <div class="text-sm text-gray-500 mt-1">\${dl.location||''} • \${dl.power_kwc?dl.power_kwc+' kWc':''}</div></div>
          <div class="text-right"><span class="phase-badge \${PHASE_COLORS[dl.phase]||''}">\${PHASES[dl.phase]||dl.phase}</span>
          <div class="text-sm font-semibold text-green-600 mt-1">\${fmt(dl.estimated_value)}</div></div>
        </div></div>\`).join('');
    }else{el('deals-list').innerHTML='<div class="p-8 text-center text-gray-400"><i class="fas fa-inbox mr-2"></i>Aucun deal. Cliquez sur "Nouveau Deal" pour commencer.</div>';}
  }catch(e){el('deals-list').innerHTML='<div class="p-4 text-red-500">Erreur chargement</div>';}
}

async function saveDeal(e){
  e.preventDefault();
  const body={deal_name:el('d-name').value,deal_type:el('d-type').value,power_kwc:parseFloat(el('d-power').value)||null,estimated_value:parseFloat(el('d-value').value)||null,commission_rate:parseFloat(el('d-commission').value)||3,location:el('d-location').value,notes:el('d-notes').value};
  try{const r=await fetch(API+'/deals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(r.ok){closeModal();loadDeals();loadKPIs();}
  }catch(e){alert('Erreur: '+e.message)}
}

function showCreate(){el('modal').classList.remove('hidden')}
function closeModal(){el('modal').classList.add('hidden')}
function el(id){return document.getElementById(id)}

loadKPIs();loadDeals();
</script>
</body></html>`;
}
