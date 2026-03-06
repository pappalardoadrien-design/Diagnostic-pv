/**
 * Page Pipeline Commercial - Vue Kanban
 * /crm/pipeline
 */

export function getPipelinePage(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pipeline Commercial — DiagPV</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .kanban-col { min-height: 400px; }
    .opp-card { transition: all .2s; cursor: grab; }
    .opp-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.15); }
    .opp-card.dragging { opacity: .5; }
    .kanban-col.drag-over { background: rgba(59,130,246,.05); border-color: #3b82f6 !important; }
    .stage-badge { font-size: 10px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; text-transform: uppercase; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- NAV -->
  <nav class="bg-gradient-to-r from-slate-800 to-teal-700 text-white px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/crm/dashboard" class="text-white/70 hover:text-white"><i class="fas fa-arrow-left mr-2"></i>Dashboard</a>
      <h1 class="text-lg font-bold"><i class="fas fa-chart-line mr-2"></i>Pipeline Commercial</h1>
    </div>
    <div class="flex gap-3">
      <button onclick="showCreateModal()" class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"><i class="fas fa-plus mr-1"></i>Nouvelle Opportunité</button>
      <a href="/crm/clients" class="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm"><i class="fas fa-users mr-1"></i>Clients</a>
    </div>
  </nav>

  <!-- KPI BAR -->
  <div id="kpi-bar" class="bg-white border-b px-6 py-3 flex items-center gap-8 text-sm overflow-x-auto">
    <div class="text-center"><div class="text-gray-500">CA Pipeline</div><div id="kpi-pipeline" class="text-lg font-bold text-blue-600">—</div></div>
    <div class="text-center"><div class="text-gray-500">CA Signé</div><div id="kpi-signed" class="text-lg font-bold text-green-600">—</div></div>
    <div class="text-center"><div class="text-gray-500">Opportunités</div><div id="kpi-active" class="text-lg font-bold text-slate-800">—</div></div>
    <div class="text-center"><div class="text-gray-500">Taux Conversion</div><div id="kpi-conversion" class="text-lg font-bold text-purple-600">—</div></div>
    <div class="text-center"><div class="text-gray-500">Activités (7j)</div><div id="kpi-activities" class="text-lg font-bold text-amber-600">—</div></div>
  </div>

  <!-- KANBAN BOARD -->
  <div class="p-4 overflow-x-auto">
    <div id="kanban-board" class="flex gap-4 min-w-max">
      <!-- Colonnes générées par JS -->
    </div>
  </div>

  <!-- MODAL CRÉER/ÉDITER -->
  <div id="create-modal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b flex justify-between items-center">
        <h2 id="modal-title" class="text-lg font-bold">Nouvelle Opportunité</h2>
        <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      <form id="opp-form" class="p-6 space-y-4" onsubmit="saveOpportunity(event)">
        <input type="hidden" id="opp-id">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Titre *</label><input id="opp-title" required class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ex: Audit centrale 500kWc"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Client *</label><select id="opp-client" required class="w-full border rounded-lg px-3 py-2 text-sm"></select></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select id="opp-type" class="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="diagnostic">Diagnostic</option>
              <option value="repowering">Repowering</option>
              <option value="amo">AMO</option>
              <option value="acquisition">Acquisition/Cession</option>
              <option value="formation">Formation</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Montant (€)</label><input id="opp-amount" type="number" step="100" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Date close prévue</label><input id="opp-close-date" type="date" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Source</label><input id="opp-source" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ex: LinkedIn, Appel entrant"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Catégorie source</label>
            <select id="opp-source-cat" class="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">—</option>
              <option value="quick_win">Quick Win</option>
              <option value="automation">Automation</option>
              <option value="inbound">Inbound</option>
              <option value="niche">Niche</option>
              <option value="institutionnel">Institutionnel</option>
              <option value="financier">Financier</option>
              <option value="formation">Formation/Consulting</option>
            </select>
          </div>
          <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Prochaine action</label><input id="opp-next" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ex: Envoyer proposition commerciale"></div>
          <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea id="opp-notes" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Notes internes"></textarea></div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2 border rounded-lg text-sm">Annuler</button>
          <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold">Enregistrer</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const API = '/api/crm/pipeline';
    const stageConfig = [
      { key: 'prospect', label: 'Prospect', color: '#6b7280', bg: 'bg-gray-100', border: 'border-gray-300', icon: '🎯' },
      { key: 'qualification', label: 'Qualification', color: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-300', icon: '🔍' },
      { key: 'proposition', label: 'Proposition', color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-300', icon: '📄' },
      { key: 'negociation', label: 'Négociation', color: '#8b5cf6', bg: 'bg-purple-50', border: 'border-purple-300', icon: '🤝' },
      { key: 'signe', label: 'Signé ✅', color: '#10b981', bg: 'bg-green-50', border: 'border-green-300', icon: '✅' },
      { key: 'perdu', label: 'Perdu', color: '#ef4444', bg: 'bg-red-50', border: 'border-red-300', icon: '❌' }
    ];
    let clients = [];

    function fmt(n) { return new Intl.NumberFormat('fr-FR', {style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0); }

    async function loadKPIs() {
      try {
        const r = await fetch(API + '/kpis');
        const d = await r.json();
        if (!d.success) return;
        document.getElementById('kpi-pipeline').textContent = fmt(d.kpis.pipeline_weighted_ca);
        document.getElementById('kpi-signed').textContent = fmt(d.kpis.signed_ca);
        document.getElementById('kpi-active').textContent = d.kpis.active_count;
        document.getElementById('kpi-conversion').textContent = d.kpis.conversion_rate + '%';
        document.getElementById('kpi-activities').textContent = d.kpis.activities_7d;
      } catch(e) { console.error(e); }
    }

    async function loadKanban() {
      try {
        const r = await fetch(API + '/kanban');
        const d = await r.json();
        const board = document.getElementById('kanban-board');
        board.innerHTML = '';
        stageConfig.forEach(stage => {
          const col = d.columns?.find(c => c.key === stage.key) || { opportunities: [], count: 0, total_amount: 0 };
          board.innerHTML += \`
            <div class="kanban-col w-72 flex-shrink-0 rounded-xl border-2 \${stage.border} \${stage.bg} p-3"
                 data-stage="\${stage.key}"
                 ondragover="event.preventDefault(); this.classList.add('drag-over')"
                 ondragleave="this.classList.remove('drag-over')"
                 ondrop="dropCard(event, '\${stage.key}'); this.classList.remove('drag-over')">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span>\${stage.icon}</span>
                  <span class="font-bold text-sm" style="color:\${stage.color}">\${stage.label}</span>
                  <span class="bg-white rounded-full px-2 py-0.5 text-xs font-bold">\${col.count}</span>
                </div>
                <span class="text-xs font-semibold" style="color:\${stage.color}">\${fmt(col.total_amount)}</span>
              </div>
              <div class="space-y-2">
                \${col.opportunities.map(o => \`
                  <div class="opp-card bg-white rounded-lg p-3 border shadow-sm" 
                       draggable="true" data-id="\${o.id}"
                       ondragstart="event.dataTransfer.setData('id', o.id); this.classList.add('dragging')"
                       ondragend="this.classList.remove('dragging')">
                    <div class="flex justify-between items-start mb-1">
                      <span class="font-semibold text-sm text-gray-800 leading-tight">\${o.title}</span>
                      <button onclick="editOpp(\${o.id})" class="text-gray-400 hover:text-blue-500 ml-2"><i class="fas fa-pen text-xs"></i></button>
                    </div>
                    <div class="text-xs text-gray-500 mb-2">\${o.client_name || '—'}</div>
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-sm" style="color:\${stage.color}">\${fmt(o.amount)}</span>
                      <span class="stage-badge" style="background:\${stage.color}20;color:\${stage.color}">\${o.opportunity_type || 'diag'}</span>
                    </div>
                    \${o.next_action ? \`<div class="mt-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1"><i class="fas fa-bolt mr-1"></i>\${o.next_action}</div>\` : ''}
                  </div>
                \`).join('')}
              </div>
            </div>
          \`;
        });
      } catch(e) { console.error(e); }
    }

    async function dropCard(event, newStage) {
      event.preventDefault();
      const id = event.dataTransfer.getData('id');
      if (!id) return;
      try {
        await fetch(API + '/opportunities/' + id + '/stage', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: newStage })
        });
        loadKanban();
        loadKPIs();
      } catch(e) { alert('Erreur déplacement'); }
    }

    async function loadClients() {
      try {
        const r = await fetch('/api/crm/clients');
        const d = await r.json();
        clients = d.clients || [];
        const sel = document.getElementById('opp-client');
        sel.innerHTML = '<option value="">— Choisir —</option>' + clients.map(c => '<option value="'+c.id+'">'+c.company_name+'</option>').join('');
      } catch(e) {}
    }

    function showCreateModal() {
      document.getElementById('modal-title').textContent = 'Nouvelle Opportunité';
      document.getElementById('opp-form').reset();
      document.getElementById('opp-id').value = '';
      document.getElementById('create-modal').classList.remove('hidden');
    }

    function closeModal() { document.getElementById('create-modal').classList.add('hidden'); }

    async function editOpp(id) {
      try {
        const r = await fetch(API + '/opportunities/' + id);
        const d = await r.json();
        if (!d.success) return;
        const o = d.opportunity;
        document.getElementById('modal-title').textContent = 'Modifier Opportunité';
        document.getElementById('opp-id').value = o.id;
        document.getElementById('opp-title').value = o.title || '';
        document.getElementById('opp-client').value = o.client_id || '';
        document.getElementById('opp-type').value = o.opportunity_type || 'diagnostic';
        document.getElementById('opp-amount').value = o.amount || '';
        document.getElementById('opp-close-date').value = o.expected_close_date || '';
        document.getElementById('opp-source').value = o.source || '';
        document.getElementById('opp-source-cat').value = o.source_category || '';
        document.getElementById('opp-next').value = o.next_action || '';
        document.getElementById('opp-notes').value = o.notes || '';
        document.getElementById('create-modal').classList.remove('hidden');
      } catch(e) { alert('Erreur chargement'); }
    }

    async function saveOpportunity(e) {
      e.preventDefault();
      const id = document.getElementById('opp-id').value;
      const body = {
        client_id: parseInt(document.getElementById('opp-client').value),
        title: document.getElementById('opp-title').value,
        opportunity_type: document.getElementById('opp-type').value,
        amount: parseFloat(document.getElementById('opp-amount').value) || 0,
        expected_close_date: document.getElementById('opp-close-date').value || null,
        source: document.getElementById('opp-source').value || null,
        source_category: document.getElementById('opp-source-cat').value || null,
        next_action: document.getElementById('opp-next').value || null,
        notes: document.getElementById('opp-notes').value || null
      };
      try {
        const url = id ? API + '/opportunities/' + id : API + '/opportunities';
        const method = id ? 'PUT' : 'POST';
        await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
        closeModal();
        loadKanban();
        loadKPIs();
      } catch(e) { alert('Erreur sauvegarde'); }
    }

    // Init
    loadClients();
    loadKPIs();
    loadKanban();
  </script>
</body>
</html>`;
}
