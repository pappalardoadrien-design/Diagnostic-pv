/**
 * Page Formations PV - Sessions, Organismes, Participants
 * /formations
 */
export function getFormationsPage(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Formations PV — DiagPV</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>body{font-family:'Inter',sans-serif}.status-badge{font-size:11px;padding:2px 10px;border-radius:9999px;font-weight:600}</style>
</head>
<body class="bg-gray-50 min-h-screen">
  <nav class="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/crm/dashboard" class="text-white/70 hover:text-white"><i class="fas fa-arrow-left mr-2"></i>Dashboard</a>
      <h1 class="text-lg font-bold"><i class="fas fa-graduation-cap mr-2"></i>Formations PV — DiagPV</h1>
    </div>
    <button onclick="showCreate()" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold"><i class="fas fa-plus mr-1"></i>Nouvelle Session</button>
  </nav>

  <div class="p-6">
    <!-- KPIs -->
    <div id="kpis" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Sessions actives</div><div id="k-active" class="text-2xl font-bold text-orange-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">CA total</div><div id="k-revenue" class="text-2xl font-bold text-green-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">CA DiagPV</div><div id="k-diagpv" class="text-2xl font-bold text-blue-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Participants</div><div id="k-participants" class="text-2xl font-bold text-purple-600">—</div></div>
      <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-gray-500 text-xs">Organismes Qualiopi</div><div id="k-qualiopi" class="text-2xl font-bold text-amber-600">—</div></div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Sessions -->
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="font-bold text-gray-800"><i class="fas fa-chalkboard-teacher mr-2"></i>Sessions de Formation</h2>
          <div class="flex gap-2">
            <select id="filter-status" onchange="loadSessions()" class="border rounded-lg px-3 py-1 text-sm">
              <option value="">Tous statuts</option>
              <option value="planifie">Planifie</option><option value="confirme">Confirme</option>
              <option value="en_cours">En cours</option><option value="termine">Termine</option>
              <option value="annule">Annule</option>
            </select>
            <select id="filter-theme" onchange="loadSessions()" class="border rounded-lg px-3 py-1 text-sm">
              <option value="">Tous themes</option>
              <option value="diagnostic">Diagnostic</option><option value="thermographie">Thermographie</option>
              <option value="el_nocturne">EL Nocturne</option><option value="iv_curves">Courbes I-V</option>
              <option value="maintenance">Maintenance</option><option value="repowering">Repowering</option>
              <option value="reglementation">Reglementation</option><option value="securite">Securite</option>
            </select>
          </div>
        </div>
        <div id="sessions-list" class="divide-y max-h-[600px] overflow-y-auto">
          <div class="p-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Chargement...</div>
        </div>
      </div>

      <!-- Organismes -->
      <div class="bg-white rounded-xl shadow-sm border">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="font-bold text-gray-800"><i class="fas fa-building mr-2"></i>Organismes</h2>
          <button onclick="showOrganisme()" class="text-orange-600 hover:text-orange-700 text-sm font-semibold"><i class="fas fa-plus mr-1"></i>Ajouter</button>
        </div>
        <div id="organismes-list" class="divide-y max-h-[400px] overflow-y-auto"></div>
        <div id="by-theme" class="p-4 border-t">
          <h3 class="text-sm font-semibold text-gray-600 mb-2">Par theme</h3>
          <div id="theme-stats" class="space-y-1"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Session -->
  <div id="modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b flex justify-between items-center">
        <h2 class="text-lg font-bold">Nouvelle Session de Formation</h2>
        <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <form id="session-form" class="p-6 space-y-4" onsubmit="saveSession(event)">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Titre *</label><input id="s-title" required class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ex: Formation Thermographie Avancee"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select id="s-type" class="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="inter">Inter-entreprises</option><option value="intra">Intra-entreprise</option>
              <option value="terrain">Terrain</option><option value="webinaire">Webinaire</option>
              <option value="e_learning">E-learning</option>
            </select>
          </div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Theme</label>
            <select id="s-theme" class="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="diagnostic">Diagnostic PV</option><option value="thermographie">Thermographie</option>
              <option value="el_nocturne">EL Nocturne</option><option value="iv_curves">Courbes I-V</option>
              <option value="maintenance">Maintenance</option><option value="repowering">Repowering</option>
              <option value="reglementation">Reglementation</option><option value="securite">Securite</option>
            </select>
          </div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
            <select id="s-level" class="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="debutant">Debutant</option><option value="intermediaire" selected>Intermediaire</option>
              <option value="avance">Avance</option><option value="expert">Expert</option>
            </select>
          </div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Date debut</label><input id="s-start" type="date" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Date fin</label><input id="s-end" type="date" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Duree (heures)</label><input id="s-hours" type="number" value="7" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Prix/participant (EUR)</label><input id="s-price" type="number" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="500"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Max participants</label><input id="s-max" type="number" value="12" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
          <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Lieu</label><input id="s-location" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="L'Union (31) / Visio"></div>
          <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Programme</label><textarea id="s-program" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm"></textarea></div>
        </div>
        <button type="submit" class="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600"><i class="fas fa-save mr-1"></i>Creer la session</button>
      </form>
    </div>
  </div>

  <!-- Modal Organisme -->
  <div id="modal-org" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div class="p-6 border-b flex justify-between items-center">
        <h2 class="text-lg font-bold">Ajouter Organisme</h2>
        <button onclick="el('modal-org').classList.add('hidden')" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <form id="org-form" class="p-6 space-y-4" onsubmit="saveOrganisme(event)">
        <div><label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label><input id="o-name" required class="w-full border rounded-lg px-3 py-2 text-sm"></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select id="o-type" class="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="organisme">Organisme</option><option value="opco">OPCO</option>
              <option value="entreprise">Entreprise</option><option value="independant">Independant</option>
            </select>
          </div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Qualiopi</label>
            <select id="o-qualiopi" class="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="0">Non</option><option value="1">Oui</option>
            </select>
          </div>
        </div>
        <div><label class="block text-sm font-medium text-gray-700 mb-1">Contact email</label><input id="o-email" type="email" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
        <div><label class="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label><input id="o-commission" type="number" value="30" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
        <button type="submit" class="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600"><i class="fas fa-save mr-1"></i>Ajouter</button>
      </form>
    </div>
  </div>

<script>
const API = '/api/formations';
const STATUS_LABELS = {planifie:'Planifie',confirme:'Confirme',en_cours:'En cours',termine:'Termine',annule:'Annule'};
const STATUS_COLORS = {planifie:'bg-gray-100 text-gray-700',confirme:'bg-blue-100 text-blue-700',en_cours:'bg-amber-100 text-amber-700',termine:'bg-green-100 text-green-700',annule:'bg-red-100 text-red-700'};
const THEME_LABELS = {diagnostic:'Diagnostic',thermographie:'Thermographie',el_nocturne:'EL Nocturne',iv_curves:'Courbes I-V',maintenance:'Maintenance',repowering:'Repowering',reglementation:'Reglementation',securite:'Securite',autre:'Autre'};
const THEME_ICONS = {diagnostic:'fa-search',thermographie:'fa-temperature-high',el_nocturne:'fa-moon',iv_curves:'fa-chart-line',maintenance:'fa-wrench',repowering:'fa-sync',reglementation:'fa-gavel',securite:'fa-shield-alt',autre:'fa-folder'};

function fmt(n){return n?new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n):'—'}
function fmtDate(d){return d?new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):'—'}

async function loadKPIs(){
  try{const r=await fetch(API+'/kpis');const d=await r.json();if(d.success){const k=d.kpis;
    el('k-active').textContent=k.active_sessions||0;
    el('k-revenue').textContent=fmt(k.total_revenue);
    el('k-diagpv').textContent=fmt(k.diagpv_revenue);
    el('k-participants').textContent=k.total_participants||0;
    el('k-qualiopi').textContent=k.qualiopi_organismes||0;
    if(d.by_theme&&d.by_theme.length>0){
      el('theme-stats').innerHTML=d.by_theme.map(t=>\`<div class="flex items-center justify-between text-sm py-1">
        <span><i class="fas \${THEME_ICONS[t.theme]||'fa-folder'} mr-2 text-orange-500"></i>\${THEME_LABELS[t.theme]||t.theme}</span>
        <span class="font-semibold">\${t.count} (\${fmt(t.revenue)})</span></div>\`).join('');
    }else{el('theme-stats').innerHTML='<p class="text-gray-400 text-xs">Aucune donnee</p>';}
  }}catch(e){console.error(e)}
}

async function loadSessions(){
  try{
    const status=el('filter-status').value;const theme=el('filter-theme').value;
    let url=API+'/sessions?';if(status)url+='status='+status+'&';if(theme)url+='theme='+theme;
    const r=await fetch(url);const d=await r.json();
    if(d.success&&d.sessions.length>0){
      el('sessions-list').innerHTML=d.sessions.map(s=>\`<div class="p-4 hover:bg-gray-50 cursor-pointer" onclick="viewSession(\${s.id})">
        <div class="flex justify-between items-start">
          <div>
            <div class="font-semibold text-gray-800">\${s.title}</div>
            <div class="text-sm text-gray-500 mt-1">
              <i class="fas \${THEME_ICONS[s.theme]||'fa-folder'} mr-1"></i>\${THEME_LABELS[s.theme]||s.theme}
              \${s.location?' &bull; '+s.location:''}
              \${s.start_date?' &bull; '+fmtDate(s.start_date):''}
            </div>
            <div class="text-xs text-gray-400 mt-1">\${s.reference} &bull; \${s.duration_hours||7}h &bull; \${s.participant_count||0}/\${s.max_participants||12} participants</div>
          </div>
          <div class="text-right">
            <span class="status-badge \${STATUS_COLORS[s.status]||''}">\${STATUS_LABELS[s.status]||s.status}</span>
            <div class="text-sm font-semibold text-green-600 mt-1">\${fmt(s.price_per_participant)}/pers</div>
          </div>
        </div></div>\`).join('');
    }else{
      el('sessions-list').innerHTML='<div class="p-8 text-center text-gray-400"><i class="fas fa-graduation-cap text-4xl mb-3 block"></i><p class="font-semibold">Aucune session de formation</p><p class="text-sm mt-1">Cliquez "Nouvelle Session" pour commencer</p></div>';
    }
  }catch(e){el('sessions-list').innerHTML='<div class="p-4 text-red-500">Erreur chargement</div>';}
}

async function loadOrganismes(){
  try{const r=await fetch(API+'/organismes');const d=await r.json();
    if(d.success&&d.organismes.length>0){
      el('organismes-list').innerHTML=d.organismes.map(o=>\`<div class="p-3 hover:bg-gray-50">
        <div class="font-semibold text-sm text-gray-800">\${o.name}</div>
        <div class="text-xs text-gray-500">\${o.type||'organisme'} \${o.qualiopi_certified?'<span class="text-green-600 font-bold ml-1">Qualiopi</span>':''}</div>
        </div>\`).join('');
    }else{el('organismes-list').innerHTML='<div class="p-4 text-center text-gray-400 text-sm">Aucun organisme</div>';}
  }catch(e){console.error(e)}
}

async function saveSession(e){
  e.preventDefault();
  const body={title:el('s-title').value,formation_type:el('s-type').value,theme:el('s-theme').value,level:el('s-level').value,start_date:el('s-start').value||null,end_date:el('s-end').value||null,duration_hours:parseFloat(el('s-hours').value)||7,price_per_participant:parseFloat(el('s-price').value)||0,max_participants:parseInt(el('s-max').value)||12,location:el('s-location').value||null,program_outline:el('s-program').value||null};
  try{const r=await fetch(API+'/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(r.ok){closeModal();loadSessions();loadKPIs();}else{const d=await r.json();alert(d.error||'Erreur');}
  }catch(e){alert('Erreur: '+e.message)}
}

async function saveOrganisme(e){
  e.preventDefault();
  const body={name:el('o-name').value,type:el('o-type').value,qualiopi_certified:parseInt(el('o-qualiopi').value),contact_email:el('o-email').value||null,commission_rate:parseFloat(el('o-commission').value)||30};
  try{const r=await fetch(API+'/organismes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(r.ok){el('modal-org').classList.add('hidden');loadOrganismes();loadKPIs();}
  }catch(e){alert('Erreur: '+e.message)}
}

function viewSession(id){
  window.location.href='/formations/'+id;
}

function showCreate(){el('modal').classList.remove('hidden')}
function showOrganisme(){el('modal-org').classList.remove('hidden')}
function closeModal(){el('modal').classList.add('hidden')}
function el(id){return document.getElementById(id)}

loadKPIs();loadSessions();loadOrganismes();
</script>
</body></html>`;
}
