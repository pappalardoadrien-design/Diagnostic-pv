// ============================================================================
// MODULE NAVIGATION - Navigation fixe entre modules d'audit
// ============================================================================
// Composant réutilisable pour navigation sticky entre modules
// Avec indicateurs de complétion et badges

async function loadModuleNavigation(auditToken, currentModule) {
  try {
    const response = await axios.get(`/api/audits/${auditToken}`);
    const audit = response.data.audit;
    const modules = JSON.parse(audit.modules_enabled || '[]');
    
    // Récupérer statistiques de chaque module
    const stats = await getModuleStats(auditToken, modules);
    
    const nav = document.getElementById('module-nav');
    if (!nav) return;
    
    nav.innerHTML = `
      <div class="bg-gray-900 rounded-lg shadow-2xl border-2 border-yellow-400 sticky top-4 z-50">
        <!-- En-tête -->
        <div class="bg-gradient-to-r from-gray-800 to-gray-900 p-4 border-b-2 border-yellow-400 rounded-t-lg">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-xl font-black text-yellow-400">
                <i class="fas fa-layer-group mr-2"></i>
                MODULES AUDIT
              </h3>
              <p class="text-sm text-gray-400">${audit.project_name} - ${audit.client_name}</p>
            </div>
            <div class="flex gap-2">
              <button onclick="window.location.href='/crm/dashboard'" class="bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded font-bold text-sm">
                <i class="fas fa-home mr-1"></i>Dashboard
              </button>
              <button onclick="generateMultiModuleReport()" class="bg-green-600 hover:bg-green-700 px-3 py-2 rounded font-bold text-sm">
                <i class="fas fa-file-pdf mr-1"></i>PDF
              </button>
              <button onclick="exportAuditDataCSV()" class="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded font-bold text-sm" title="Export CSV complet">
                <i class="fas fa-file-csv mr-1"></i>CSV
              </button>
            </div>
          </div>
        </div>
        
        <!-- Navigation modules -->
        <div class="p-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${generateModuleButton('EL', 'moon', 'EL Cartographie', modules, currentModule, stats.el, auditToken, 'green')}
            ${generateModuleButton('IV', 'chart-line', 'Courbes I-V', modules, currentModule, stats.iv, auditToken, 'orange')}
            ${generateModuleButton('VISUAL', 'eye', 'Inspections Visuelles', modules, currentModule, stats.visual, auditToken, 'teal')}
            ${generateModuleButton('ISOLATION', 'bolt', 'Tests Isolation', modules, currentModule, stats.isolation, auditToken, 'red')}
          </div>
        </div>
        
        <!-- Barre progression globale -->
        <div class="bg-gray-800 p-4 border-t border-gray-700 rounded-b-lg">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-bold text-gray-400">PROGRESSION GLOBALE</span>
            <span class="text-sm font-black text-yellow-400">${calculateGlobalProgress(stats, modules)}%</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-3">
            <div class="bg-gradient-to-r from-yellow-400 to-green-400 h-3 rounded-full transition-all duration-500" 
                 style="width: ${calculateGlobalProgress(stats, modules)}%"></div>
          </div>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Erreur chargement navigation:', error);
  }
}

// Génération bouton module avec stats
function generateModuleButton(moduleKey, icon, label, modulesEnabled, currentModule, stats, auditToken, color) {
  if (!modulesEnabled.includes(moduleKey)) {
    return `
      <div class="bg-gray-800 opacity-40 p-4 rounded-lg border border-gray-700 text-center">
        <i class="fas fa-${icon} text-2xl text-gray-600 mb-2"></i>
        <p class="text-xs text-gray-600 font-bold">${label}</p>
        <p class="text-xs text-gray-700 mt-1">Non activé</p>
      </div>
    `;
  }
  
  const isCurrent = currentModule === moduleKey;
  const urlMap = {
    'EL': `/audit/${auditToken}`,
    'IV': `/audit/${auditToken}/iv`,
    'VISUAL': `/audit/${auditToken}/visual`,
    'ISOLATION': `/audit/${auditToken}/isolation`
  };
  
  const progressColor = stats.progress >= 80 ? 'green' : stats.progress >= 40 ? 'yellow' : 'red';
  const bgColor = isCurrent ? `bg-${color}-700 border-${color}-400` : `bg-gray-800 hover:bg-gray-700 border-gray-600`;
  
  return `
    <a href="${urlMap[moduleKey]}" 
       class="${bgColor} p-4 rounded-lg border-2 transition-all cursor-pointer text-center ${isCurrent ? 'ring-2 ring-' + color + '-300' : ''}">
      <div class="flex justify-between items-start mb-2">
        <i class="fas fa-${icon} text-2xl text-${color}-400"></i>
        ${stats.hasData ? '<span class="bg-green-500 text-white text-xs px-2 py-1 rounded-full">✓</span>' : ''}
      </div>
      <p class="text-sm font-bold text-white mb-1">${label}</p>
      ${stats.count > 0 ? `<p class="text-xs text-${color}-300 font-bold">${stats.count} ${stats.unit}</p>` : '<p class="text-xs text-gray-500">Aucune donnée</p>'}
      
      <!-- Mini progress bar -->
      <div class="w-full bg-gray-700 rounded-full h-1 mt-2">
        <div class="bg-${progressColor}-400 h-1 rounded-full" style="width: ${stats.progress}%"></div>
      </div>
    </a>
  `;
}

// Récupération stats de chaque module
async function getModuleStats(auditToken, modules) {
  const stats = {
    el: { count: 0, progress: 0, hasData: false, unit: 'modules' },
    iv: { count: 0, progress: 0, hasData: false, unit: 'mesures' },
    visual: { count: 0, progress: 0, hasData: false, unit: 'observations' },
    isolation: { count: 0, progress: 0, hasData: false, unit: 'tests' }
  };
  
  // Stats EL
  if (modules.includes('EL')) {
    try {
      const response = await axios.get(`/api/el/audits/${auditToken}`);
      const elData = response.data.audit;
      stats.el.count = elData?.total_modules || 0;
      stats.el.progress = Math.round(elData?.completion_rate || 0);
      stats.el.hasData = stats.el.count > 0;
    } catch (e) {
      console.log('EL stats error:', e.message);
    }
  }
  
  // Stats I-V
  if (modules.includes('IV')) {
    try {
      const response = await axios.get(`/api/iv/measurements/${auditToken}`);
      const measurements = response.data.measurements || [];
      stats.iv.count = measurements.length;
      stats.iv.progress = measurements.length > 0 ? 100 : 0;
      stats.iv.hasData = measurements.length > 0;
    } catch (e) {
      console.log('IV stats error:', e.message);
    }
  }
  
  // Stats Visual
  if (modules.includes('VISUAL')) {
    try {
      const response = await axios.get(`/api/visual/inspections/${auditToken}`);
      const inspections = response.data.inspections || [];
      stats.visual.count = inspections.length;
      stats.visual.progress = inspections.length > 0 ? 100 : 0;
      stats.visual.hasData = inspections.length > 0;
    } catch (e) {
      console.log('Visual stats error:', e.message);
    }
  }
  
  // Stats Isolation
  if (modules.includes('ISOLATION')) {
    try {
      const response = await axios.get(`/api/isolation/tests/${auditToken}`);
      const tests = response.data.tests || [];
      stats.isolation.count = tests.length;
      stats.isolation.progress = tests.length > 0 ? 100 : 0;
      stats.isolation.hasData = tests.length > 0;
    } catch (e) {
      console.log('Isolation stats error:', e.message);
    }
  }
  
  return stats;
}

// Calcul progression globale
function calculateGlobalProgress(stats, modules) {
  let total = 0;
  let count = 0;
  
  if (modules.includes('EL')) {
    total += stats.el.progress;
    count++;
  }
  if (modules.includes('IV')) {
    total += stats.iv.progress;
    count++;
  }
  if (modules.includes('VISUAL')) {
    total += stats.visual.progress;
    count++;
  }
  if (modules.includes('ISOLATION')) {
    total += stats.isolation.progress;
    count++;
  }
  
  return count > 0 ? Math.round(total / count) : 0;
}

// Fonction rapport global (doit exister dans page)
function generateMultiModuleReport() {
  const auditToken = window.location.pathname.split('/')[2];
  window.open(`/api/reports/multi-module/${auditToken}`, '_blank');
}

// Fonction export CSV complet
function exportAuditDataCSV() {
  const auditToken = window.location.pathname.split('/')[2];
  window.open(`/api/exports/csv/${auditToken}`, '_blank');
}

// Fonction export CSV par module
function exportModuleDataCSV(moduleName) {
  const auditToken = window.location.pathname.split('/')[2];
  window.open(`/api/exports/csv/${auditToken}/${moduleName}`, '_blank');
}
