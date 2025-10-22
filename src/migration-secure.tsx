import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/api/*', cors())

// Page de sauvegarde des audits
app.get('/backup-audits', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Backup Audits DiagPV</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 p-8">
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-xl shadow-lg p-8">
                <h1 class="text-3xl font-bold text-gray-800 mb-6">
                    🛡️ Sauvegarde Sécurisée des Audits
                </h1>
                
                <div id="status" class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">Chargement des données...</p>
                </div>
                
                <div id="auditsList" class="mb-6"></div>
                
                <div class="flex space-x-4">
                    <button onclick="exportAllAudits()" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-bold">
                        📥 Télécharger Backup Complet
                    </button>
                    <button onclick="viewAuditData()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-bold">
                        👁️ Voir Données Brutes
                    </button>
                </div>
                
                <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p class="text-sm text-yellow-800">
                        <strong>⚠️ Important :</strong> Ce backup contient TOUTES vos données d'audit. 
                        Conservez-le précieusement avant toute mise à jour.
                    </p>
                </div>
            </div>
        </div>
        
        <script>
            let allAuditData = {};
            
            // Charger toutes les données d'audit
            function loadAllAuditData() {
                const sources = {
                    localStorage: {},
                    indexedDB: {},
                    summary: {}
                };
                
                // 1. LocalStorage
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.includes('diagpv') || key.includes('audit')) {
                        try {
                            sources.localStorage[key] = JSON.parse(localStorage.getItem(key));
                        } catch (e) {
                            sources.localStorage[key] = localStorage.getItem(key);
                        }
                    }
                }
                
                // 2. Compter audits
                const mainKey = 'diagpv_audit_session';
                if (sources.localStorage[mainKey]) {
                    const data = sources.localStorage[mainKey];
                    sources.summary = {
                        found: true,
                        sessionId: data.sessionId || 'N/A',
                        lastSaved: data.lastSaved || 'N/A',
                        moduleCount: data.modulePositions?.length || 0,
                        strings: data.strings?.length || 0,
                        defects: countDefects(data),
                        projectName: data.projectName || 'Sans nom'
                    };
                } else {
                    sources.summary = { found: false, message: 'Aucun audit trouvé' };
                }
                
                allAuditData = sources;
                displayAuditInfo();
            }
            
            function countDefects(data) {
                if (!data.modulePositions) return 0;
                return data.modulePositions.filter(m => m.status !== 'ok').length;
            }
            
            function displayAuditInfo() {
                const status = document.getElementById('status');
                const list = document.getElementById('auditsList');
                
                if (allAuditData.summary.found) {
                    const s = allAuditData.summary;
                    status.innerHTML = \`
                        <div class="text-green-800">
                            <p class="font-bold mb-2">✅ Audit trouvé !</p>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div><strong>Projet:</strong> \${s.projectName}</div>
                                <div><strong>Session:</strong> \${s.sessionId}</div>
                                <div><strong>Modules:</strong> \${s.moduleCount}</div>
                                <div><strong>Strings:</strong> \${s.strings}</div>
                                <div><strong>Défauts:</strong> \${s.defects}</div>
                                <div><strong>Sauvegardé:</strong> \${new Date(s.lastSaved).toLocaleString('fr-FR')}</div>
                            </div>
                        </div>
                    \`;
                    
                    list.innerHTML = \`
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h3 class="font-bold mb-2">Clés LocalStorage trouvées:</h3>
                            <ul class="text-sm space-y-1">
                                \${Object.keys(allAuditData.localStorage).map(key => 
                                    \`<li class="text-gray-600">• \${key}</li>\`
                                ).join('')}
                            </ul>
                        </div>
                    \`;
                } else {
                    status.innerHTML = \`
                        <p class="text-red-800">❌ Aucun audit trouvé dans le navigateur</p>
                    \`;
                }
            }
            
            function exportAllAudits() {
                const dataStr = JSON.stringify(allAuditData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = \`diagpv_backup_\${new Date().toISOString().slice(0,10)}.json\`;
                link.click();
                URL.revokeObjectURL(url);
                
                alert('✅ Backup téléchargé ! Conservez ce fichier précieusement.');
            }
            
            function viewAuditData() {
                const win = window.open('', '_blank');
                win.document.write('<pre>' + JSON.stringify(allAuditData, null, 2) + '</pre>');
            }
            
            // Charger au démarrage
            document.addEventListener('DOMContentLoaded', loadAllAuditData);
        </script>
    </body>
    </html>
  `)
})

export default app
