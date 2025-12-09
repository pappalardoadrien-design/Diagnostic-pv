/**
 * PAGE FIN D'AUDIT - INTERFACE COMPLÉTION
 * 
 * Checklist modules, statuts, génération rapport final PDF
 * Accessible après saisie terrain complète
 */

import { Context } from 'hono';

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

export async function getAuditCompletePage(c: Context<{ Bindings: Bindings }>) {
  const { env } = c;
  const { audit_token } = c.req.param();
  
  return c.html(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fin d'Audit - DiagPV Hub</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white min-h-screen">
  <div class="container mx-auto p-6 max-w-6xl">
    
    <!-- En-tête -->
    <header class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <i class="fas fa-flag-checkered text-6xl text-green-400 mr-4"></i>
          <div>
            <h1 class="text-5xl font-black bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              FIN D'AUDIT
            </h1>
            <p class="text-xl text-gray-300 mt-2">
              Audit <span class="text-green-400 font-mono">${audit_token}</span>
            </p>
          </div>
        </div>
        
        <!-- Actions rapides -->
        <div class="flex gap-3">
          <a href="/crm/dashboard" 
             class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition">
            <i class="fas fa-arrow-left mr-2"></i>
            Retour Dashboard
          </a>
          <button onclick="refreshData()" 
                  class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition">
            <i class="fas fa-sync mr-2"></i>
            Rafraîchir
          </button>
        </div>
      </div>
    </header>

    <!-- Chargement -->
    <div id="loading" class="text-center py-20">
      <i class="fas fa-spinner fa-spin text-6xl text-green-400 mb-4"></i>
      <p class="text-xl text-gray-300">Chargement statut audit...</p>
    </div>

    <!-- Contenu principal (caché initialement) -->
    <div id="content" class="hidden">
      
      <!-- Statistiques globales -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <!-- KPI Modules EL -->
        <div class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-6 border-2 border-blue-400 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <i class="fas fa-bolt text-3xl text-blue-200"></i>
            <span class="text-xs bg-blue-600 px-3 py-1 rounded-full font-bold">EL</span>
          </div>
          <div class="text-4xl font-black mb-1" id="stat-el-total">-</div>
          <div class="text-blue-200 text-sm mb-2">Modules analysés</div>
          <div class="flex gap-2 text-xs">
            <span class="bg-green-600 px-2 py-1 rounded">✓ <span id="stat-el-ok">-</span></span>
            <span class="bg-red-600 px-2 py-1 rounded">✗ <span id="stat-el-defects">-</span></span>
          </div>
        </div>

        <!-- KPI I-V -->
        <div class="bg-gradient-to-br from-purple-900 to-purple-700 rounded-xl p-6 border-2 border-purple-400 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <i class="fas fa-chart-line text-3xl text-purple-200"></i>
            <span class="text-xs bg-purple-600 px-3 py-1 rounded-full font-bold">I-V</span>
          </div>
          <div class="text-4xl font-black mb-1" id="stat-iv-total">-</div>
          <div class="text-purple-200 text-sm mb-2">Mesures I-V</div>
          <div class="text-xs bg-purple-600 px-2 py-1 rounded inline-block">
            Pmax: <span id="stat-iv-pmax">-</span>W
          </div>
        </div>

        <!-- KPI Visual -->
        <div class="bg-gradient-to-br from-orange-900 to-orange-700 rounded-xl p-6 border-2 border-orange-400 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <i class="fas fa-eye text-3xl text-orange-200"></i>
            <span class="text-xs bg-orange-600 px-3 py-1 rounded-full font-bold">VISUAL</span>
          </div>
          <div class="text-4xl font-black mb-1" id="stat-visual-total">-</div>
          <div class="text-orange-200 text-sm mb-2">Inspections</div>
          <div class="text-xs bg-red-600 px-2 py-1 rounded inline-block">
            <span id="stat-visual-defects">-</span> défauts
          </div>
        </div>

        <!-- KPI Isolation -->
        <div class="bg-gradient-to-br from-green-900 to-green-700 rounded-xl p-6 border-2 border-green-400 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <i class="fas fa-shield-alt text-3xl text-green-200"></i>
            <span class="text-xs bg-green-600 px-3 py-1 rounded-full font-bold">ISOLATION</span>
          </div>
          <div class="text-4xl font-black mb-1" id="stat-isolation-total">-</div>
          <div class="text-green-200 text-sm mb-2">Tests isolation</div>
          <div class="text-xs bg-green-600 px-2 py-1 rounded inline-block">
            ✓ <span id="stat-isolation-conform">-</span> conformes
          </div>
        </div>
      </div>

      <!-- Checklist Modules -->
      <div class="bg-gray-800 rounded-xl p-6 mb-8 border-2 border-gray-700">
        <h2 class="text-2xl font-black mb-6 flex items-center">
          <i class="fas fa-tasks text-green-400 mr-3"></i>
          CHECKLIST MODULES
        </h2>

        <div class="space-y-4">
          <!-- Module EL -->
          <div id="module-el" class="flex items-center justify-between p-4 bg-gray-900 rounded-lg border-2 border-gray-700 hover:border-blue-500 transition">
            <div class="flex items-center gap-4">
              <div id="icon-el" class="text-4xl">⏳</div>
              <div>
                <h3 class="text-xl font-bold">Module Électroluminescence (EL)</h3>
                <p class="text-sm text-gray-400" id="desc-el">Chargement...</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span id="badge-el" class="px-4 py-2 rounded-lg font-bold text-sm">
                En attente
              </span>
              <a href="/photos/upload/${audit_token}?module=el" 
                 class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition text-sm">
                <i class="fas fa-camera mr-2"></i>
                Gérer EL
              </a>
            </div>
          </div>

          <!-- Module I-V -->
          <div id="module-iv" class="flex items-center justify-between p-4 bg-gray-900 rounded-lg border-2 border-gray-700 hover:border-purple-500 transition">
            <div class="flex items-center gap-4">
              <div id="icon-iv" class="text-4xl">⏳</div>
              <div>
                <h3 class="text-xl font-bold">Module Courbes I-V</h3>
                <p class="text-sm text-gray-400" id="desc-iv">Chargement...</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span id="badge-iv" class="px-4 py-2 rounded-lg font-bold text-sm">
                En attente
              </span>
              <a href="/audit/iv/${audit_token}" 
                 class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition text-sm">
                <i class="fas fa-chart-area mr-2"></i>
                Gérer I-V
              </a>
            </div>
          </div>

          <!-- Module Visual -->
          <div id="module-visual" class="flex items-center justify-between p-4 bg-gray-900 rounded-lg border-2 border-gray-700 hover:border-orange-500 transition">
            <div class="flex items-center gap-4">
              <div id="icon-visual" class="text-4xl">⏳</div>
              <div>
                <h3 class="text-xl font-bold">Module Inspection Visuelle</h3>
                <p class="text-sm text-gray-400" id="desc-visual">Chargement...</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span id="badge-visual" class="px-4 py-2 rounded-lg font-bold text-sm">
                En attente
              </span>
              <a href="/audit/visual/${audit_token}" 
                 class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition text-sm">
                <i class="fas fa-eye mr-2"></i>
                Gérer Visual
              </a>
            </div>
          </div>

          <!-- Module Isolation -->
          <div id="module-isolation" class="flex items-center justify-between p-4 bg-gray-900 rounded-lg border-2 border-gray-700 hover:border-green-500 transition">
            <div class="flex items-center gap-4">
              <div id="icon-isolation" class="text-4xl">⏳</div>
              <div>
                <h3 class="text-xl font-bold">Module Tests Isolation</h3>
                <p class="text-sm text-gray-400" id="desc-isolation">Chargement...</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span id="badge-isolation" class="px-4 py-2 rounded-lg font-bold text-sm">
                En attente
              </span>
              <a href="/audit/isolation/${audit_token}" 
                 class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition text-sm">
                <i class="fas fa-shield-alt mr-2"></i>
                Gérer Isolation
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Barre de progression globale -->
      <div class="bg-gray-800 rounded-xl p-6 mb-8 border-2 border-gray-700">
        <h3 class="text-xl font-bold mb-4">
          <i class="fas fa-percentage text-green-400 mr-2"></i>
          Progression Globale
        </h3>
        <div class="relative w-full h-8 bg-gray-700 rounded-full overflow-hidden">
          <div id="progress-bar" 
               class="absolute h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
               style="width: 0%">
          </div>
          <div class="absolute inset-0 flex items-center justify-center">
            <span id="progress-text" class="text-sm font-bold z-10">0%</span>
          </div>
        </div>
        <p class="text-sm text-gray-400 mt-2" id="progress-desc">Aucun module complété</p>
      </div>

      <!-- Actions finales -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Générer Rapport PDF -->
        <button id="btn-generate-pdf" 
                onclick="generateFinalReport()" 
                disabled
                class="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed px-8 py-6 rounded-xl font-black text-2xl transition shadow-2xl">
          <i class="fas fa-file-pdf mr-3"></i>
          GÉNÉRER RAPPORT FINAL PDF
        </button>

        <!-- Envoyer Email Client -->
        <button id="btn-send-email" 
                onclick="sendEmailClient()" 
                disabled
                class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed px-8 py-6 rounded-xl font-black text-2xl transition shadow-2xl">
          <i class="fas fa-envelope mr-3"></i>
          ENVOYER EMAIL CLIENT
        </button>
      </div>

      <!-- Informations additionnelles -->
      <div class="mt-8 bg-blue-900 border-2 border-blue-500 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <i class="fas fa-info-circle text-2xl text-blue-300 mt-1"></i>
          <div class="text-sm text-blue-100">
            <strong class="block mb-1">Information :</strong>
            Le rapport PDF sera généré automatiquement lorsque <strong>tous les modules requis</strong> seront complétés.
            Vous pourrez ensuite le télécharger et l'envoyer directement au client.
          </div>
        </div>
      </div>
    </div>

  </div>

  <script>
    const auditToken = '${audit_token}';
    let auditData = null;

    // ================================================================
    // INITIALISATION
    // ================================================================
    async function init() {
      await loadAuditStatus();
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('content').classList.remove('hidden');
    }

    // ================================================================
    // CHARGEMENT STATUT AUDIT
    // ================================================================
    async function loadAuditStatus() {
      try {
        // Charger données EL
        const elResponse = await axios.get(\`/api/el/audit/\${auditToken}\`);
        const elModules = elResponse.data.modules || [];
        
        // Charger mesures I-V
        const ivResponse = await axios.get(\`/api/iv/measurements/\${auditToken}\`);
        const ivMeasurements = ivResponse.data.measurements || [];
        
        // Charger inspections visuelles
        const visualResponse = await axios.get(\`/api/visual/inspections/\${auditToken}\`);
        const visualInspections = visualResponse.data.inspections || [];
        
        // Charger tests isolation
        const isolationResponse = await axios.get(\`/api/isolation/tests/\${auditToken}\`);
        const isolationTests = isolationResponse.data.tests || [];
        
        auditData = {
          el: elModules,
          iv: ivMeasurements,
          visual: visualInspections,
          isolation: isolationTests
        };
        
        updateStatistics();
        updateChecklist();
        updateProgress();
        
      } catch (error) {
        console.error('Erreur chargement statut:', error);
        alert('Erreur lors du chargement des données audit');
      }
    }

    // ================================================================
    // MISE À JOUR STATISTIQUES
    // ================================================================
    function updateStatistics() {
      // EL
      const elTotal = auditData.el.length;
      const elOk = auditData.el.filter(m => m.defect_type === 'ok').length;
      const elDefects = elTotal - elOk;
      document.getElementById('stat-el-total').textContent = elTotal;
      document.getElementById('stat-el-ok').textContent = elOk;
      document.getElementById('stat-el-defects').textContent = elDefects;
      
      // I-V
      const ivTotal = auditData.iv.length;
      const ivPmax = ivTotal > 0 
        ? (auditData.iv.reduce((sum, m) => sum + (m.pmax || 0), 0) / ivTotal).toFixed(1)
        : '0';
      document.getElementById('stat-iv-total').textContent = ivTotal;
      document.getElementById('stat-iv-pmax').textContent = ivPmax;
      
      // Visual
      const visualTotal = auditData.visual.length;
      const visualDefects = auditData.visual.filter(i => i.defect_type !== 'none').length;
      document.getElementById('stat-visual-total').textContent = visualTotal;
      document.getElementById('stat-visual-defects').textContent = visualDefects;
      
      // Isolation
      const isolationTotal = auditData.isolation.length;
      const isolationConform = auditData.isolation.filter(t => t.is_conform).length;
      document.getElementById('stat-isolation-total').textContent = isolationTotal;
      document.getElementById('stat-isolation-conform').textContent = isolationConform;
    }

    // ================================================================
    // MISE À JOUR CHECKLIST
    // ================================================================
    function updateChecklist() {
      updateModuleStatus('el', auditData.el.length, 'Modules EL analysés');
      updateModuleStatus('iv', auditData.iv.length, 'Mesures I-V réalisées');
      updateModuleStatus('visual', auditData.visual.length, 'Inspections visuelles');
      updateModuleStatus('isolation', auditData.isolation.length, 'Tests isolation');
    }

    function updateModuleStatus(module, count, label) {
      const icon = document.getElementById(\`icon-\${module}\`);
      const desc = document.getElementById(\`desc-\${module}\`);
      const badge = document.getElementById(\`badge-\${module}\`);
      
      if (count > 0) {
        icon.textContent = '✅';
        desc.textContent = \`\${count} \${label}\`;
        badge.textContent = 'Complété';
        badge.className = 'px-4 py-2 rounded-lg font-bold text-sm bg-green-600';
      } else {
        icon.textContent = '❌';
        desc.textContent = \`Aucune donnée \${label}\`;
        badge.textContent = 'Non démarré';
        badge.className = 'px-4 py-2 rounded-lg font-bold text-sm bg-red-600';
      }
    }

    // ================================================================
    // MISE À JOUR PROGRESSION
    // ================================================================
    function updateProgress() {
      const modules = ['el', 'iv', 'visual', 'isolation'];
      const completed = modules.filter(m => auditData[m].length > 0).length;
      const percentage = Math.round((completed / modules.length) * 100);
      
      document.getElementById('progress-bar').style.width = \`\${percentage}%\`;
      document.getElementById('progress-text').textContent = \`\${percentage}%\`;
      document.getElementById('progress-desc').textContent = 
        \`\${completed} module(s) sur \${modules.length} complétés\`;
      
      // Activer bouton PDF si 100%
      const btnPdf = document.getElementById('btn-generate-pdf');
      const btnEmail = document.getElementById('btn-send-email');
      
      if (percentage === 100) {
        btnPdf.disabled = false;
        btnEmail.disabled = false;
      }
    }

    // ================================================================
    // ACTIONS
    // ================================================================
    function generateFinalReport() {
      window.open(\`/rapport/print/\${auditToken}\`, '_blank');
    }

    function sendEmailClient() {
      alert('Fonctionnalité "Envoyer Email" à venir (Phase 11)');
    }

    function refreshData() {
      location.reload();
    }

    // ================================================================
    // INIT
    // ================================================================
    init();
  </script>
</body>
</html>
  `);
}
