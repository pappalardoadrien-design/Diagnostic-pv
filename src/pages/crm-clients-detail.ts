import { getLayout } from './layout.js';

export function getCrmClientsDetailPage() {
  const content = `
    <div class="max-w-7xl mx-auto space-y-8">
        
        <!-- Header & Actions -->
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div class="flex items-start gap-4">
                <a href="/crm/clients" class="mt-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <i class="fas fa-arrow-left text-xl"></i>
                </a>
                <div>
                    <div class="flex items-center gap-3 mb-1">
                        <h1 id="client-name" class="text-3xl font-black text-slate-900 tracking-tight">Chargement...</h1>
                        <span id="client-status-badge" class="hidden px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border"></span>
                    </div>
                    <p class="text-slate-500 font-medium flex items-center gap-2">
                        <i class="far fa-building"></i>
                        <span id="client-type-label">...</span>
                        <span class="text-slate-300 mx-2">|</span>
                        <i class="fas fa-fingerprint text-slate-400"></i>
                        <span id="info-siret" class="font-mono text-sm">...</span>
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <button id="delete-client-btn" class="px-4 py-2.5 text-red-600 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100">
                    <i class="fas fa-trash-alt mr-2"></i>Supprimer
                </button>
                <a id="edit-client-btn" href="#" class="px-4 py-2.5 text-slate-600 font-bold bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-sm">
                    <i class="fas fa-pen mr-2"></i>Modifier
                </a>
                <a id="create-project-btn" href="#" class="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5 flex items-center">
                    <i class="fas fa-plus mr-2"></i>Nouveau Site
                </a>
            </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Carte Identité -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i class="fas fa-info-circle"></i> Coordonnées
                </h3>
                <div class="space-y-4">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-slate-500 uppercase">Adresse</div>
                            <div id="address-full" class="text-slate-900 font-medium">...</div>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-file-invoice"></i>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-slate-500 uppercase">TVA Intra</div>
                            <div id="info-vat" class="text-slate-900 font-medium font-mono">...</div>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-slate-500 uppercase">Client depuis le</div>
                            <div id="info-created-at" class="text-slate-900 font-medium">...</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Carte Contact Principal -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i class="fas fa-user-circle"></i> Contact Principal
                </h3>
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xl">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <div id="contact-name" class="text-lg font-bold text-slate-900">...</div>
                        <div id="contact-role" class="text-sm font-medium text-slate-500">...</div>
                    </div>
                </div>
                <div class="space-y-3">
                    <a id="contact-email-link" href="#" class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors group">
                        <i class="fas fa-envelope text-slate-400 group-hover:text-blue-500"></i>
                        <span id="contact-email" class="font-medium text-sm truncate">...</span>
                    </a>
                    <a id="contact-phone-link" href="#" class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-green-50 hover:text-green-600 transition-colors group">
                        <i class="fas fa-phone text-slate-400 group-hover:text-green-500"></i>
                        <span id="contact-phone" class="font-medium text-sm">...</span>
                    </a>
                </div>
            </div>

            <!-- Carte Notes -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-5">
                    <i class="fas fa-sticky-note text-6xl"></i>
                </div>
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i class="fas fa-pen-alt"></i> Notes Internes
                </h3>
                <div id="notes-content" class="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                    <em class="text-slate-400">Aucune note pour ce client.</em>
                </div>
            </div>
        </div>

        <!-- Onglets & Contenu -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
            
            <!-- Tab Headers -->
            <div class="flex border-b border-slate-200 bg-slate-50/50">
                <button class="tab-btn active group px-8 py-5 text-sm font-bold border-b-2 border-transparent hover:bg-white transition-all relative flex items-center gap-2" data-target="sites">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    Sites & Projets
                    <span id="sites-count" class="ml-2 px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs">0</span>
                </button>
                <button class="tab-btn group px-8 py-5 text-sm font-bold border-b-2 border-transparent hover:bg-white transition-all relative flex items-center gap-2" data-target="interventions">
                    <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                    Missions & Planning
                    <span id="interventions-count" class="ml-2 px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs">0</span>
                </button>
                <button class="tab-btn group px-8 py-5 text-sm font-bold border-b-2 border-transparent hover:bg-white transition-all relative flex items-center gap-2" data-target="audits">
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    Rapports d'Audit
                    <span id="audits-count" class="ml-2 px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs">0</span>
                </button>
            </div>

            <!-- Tab Contents -->
            <div class="p-8">
                
                <!-- Sites Tab -->
                <div id="tab-sites" class="tab-content active space-y-4">
                    <div id="sites-list-container" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- JS injected content -->
                    </div>
                </div>

                <!-- Interventions Tab -->
                <div id="tab-interventions" class="tab-content hidden">
                    <div class="overflow-x-auto rounded-xl border border-slate-200">
                        <table class="w-full text-left">
                            <thead class="bg-slate-50 text-xs uppercase font-black text-slate-500">
                                <tr>
                                    <th class="px-6 py-4">Date</th>
                                    <th class="px-6 py-4">Type</th>
                                    <th class="px-6 py-4">Site</th>
                                    <th class="px-6 py-4">Technicien</th>
                                    <th class="px-6 py-4">Statut</th>
                                    <th class="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody id="interventions-list-container" class="divide-y divide-slate-100 bg-white">
                                <!-- JS injected content -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Audits Tab -->
                <div id="tab-audits" class="tab-content hidden">
                     <div class="overflow-x-auto rounded-xl border border-slate-200">
                        <table class="w-full text-left">
                            <thead class="bg-slate-50 text-xs uppercase font-black text-slate-500">
                                <tr>
                                    <th class="px-6 py-4">Date</th>
                                    <th class="px-6 py-4">Type</th>
                                    <th class="px-6 py-4">Site</th>
                                    <th class="px-6 py-4">Modules</th>
                                    <th class="px-6 py-4 text-right">Rapport</th>
                                </tr>
                            </thead>
                            <tbody id="audits-list-container" class="divide-y divide-slate-100 bg-white">
                                <!-- JS injected content -->
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Logic -->
    <script>
        // --- DATA STATE ---
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('id');
        let clientData = null;
        let projectsData = [];
        let interventionsData = [];
        let auditsData = [];

        // --- INIT ---
        async function init() {
            if(!clientId) return window.location.href = '/crm/clients';

            try {
                // Fetch Core Data
                const clientRes = await fetch(\`/api/crm/clients/\${clientId}\`);
                const clientJson = await clientRes.json();
                if(!clientJson.success) throw new Error('Client introuvable');
                clientData = clientJson.client;

                // Render Header First
                renderClientHeader();
                renderClientCards();

                // Fetch Related Data in Parallel
                const [projectsRes, interventionsRes, auditsRes] = await Promise.all([
                    fetch(\`/api/crm/clients/\${clientId}/projects\`).then(r => r.json()).catch(e => ({projects: []})),
                    fetch(\`/api/planning/interventions?client_id=\${clientId}\`).then(r => r.json()).catch(e => ({interventions: []})),
                    fetch(\`/api/audits\`).then(r => r.json()).catch(e => ({audits: []})) // Fallback needed: normally filtered by backend
                ]);

                projectsData = projectsRes.projects || [];
                interventionsData = interventionsRes.interventions || [];
                
                // Client-side filtering for audits (mock approach)
                const clientInterventionIds = interventionsData.map(i => i.id);
                auditsData = (auditsRes.audits || []).filter(a => clientInterventionIds.includes(a.intervention_id));

                // Update UI
                updateCounters();
                renderSitesList();
                renderInterventionsList();
                renderAuditsList();

            } catch (err) {
                console.error(err);
                alert('Erreur de chargement: ' + err.message);
            }
        }

        // --- RENDERERS ---
        function renderClientHeader() {
            document.getElementById('client-name').textContent = clientData.company_name;
            document.getElementById('info-siret').textContent = clientData.siret || 'SIRET Non renseigné';
            document.getElementById('client-type-label').textContent = clientData.client_type === 'company' ? 'Entreprise' : 'Particulier';
            
            const badge = document.getElementById('client-status-badge');
            badge.classList.remove('hidden');
            
            const styles = {
                'active': 'bg-green-100 text-green-700 border-green-200',
                'inactive': 'bg-slate-100 text-slate-600 border-slate-200',
                'prospect': 'bg-amber-100 text-amber-700 border-amber-200'
            };
            badge.className = \`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border \${styles[clientData.status] || styles.inactive}\`;
            badge.textContent = clientData.status;

            // Links
            document.getElementById('edit-client-btn').href = \`/crm/clients/edit?id=\${clientId}\`;
            document.getElementById('create-project-btn').href = \`/crm/projects/create?client_id=\${clientId}\`;
        }

        function renderClientCards() {
            // Address
            const addr = [clientData.address_street, clientData.address_postal_code, clientData.address_city].filter(Boolean).join(', ');
            document.getElementById('address-full').textContent = addr || 'N/A';
            document.getElementById('info-vat').textContent = clientData.vat_number || 'N/A';
            document.getElementById('info-created-at').textContent = new Date(clientData.created_at).toLocaleDateString('fr-FR');

            // Contact
            document.getElementById('contact-name').textContent = clientData.main_contact_name || 'Aucun contact';
            document.getElementById('contact-role').textContent = clientData.main_contact_role || '';
            
            const emailEl = document.getElementById('contact-email');
            if(clientData.main_contact_email) {
                emailEl.textContent = clientData.main_contact_email;
                document.getElementById('contact-email-link').href = 'mailto:' + clientData.main_contact_email;
            } else {
                emailEl.textContent = 'Non renseigné';
                document.getElementById('contact-email-link').classList.add('pointer-events-none', 'opacity-50');
            }

            const phoneEl = document.getElementById('contact-phone');
            if(clientData.main_contact_phone) {
                phoneEl.textContent = clientData.main_contact_phone;
                document.getElementById('contact-phone-link').href = 'tel:' + clientData.main_contact_phone;
            } else {
                phoneEl.textContent = 'Non renseigné';
                document.getElementById('contact-phone-link').classList.add('pointer-events-none', 'opacity-50');
            }

            // Notes
            if(clientData.notes) {
                document.getElementById('notes-content').textContent = clientData.notes;
            }
        }

        function updateCounters() {
            document.getElementById('sites-count').textContent = projectsData.length;
            document.getElementById('interventions-count').textContent = interventionsData.length;
            document.getElementById('audits-count').textContent = auditsData.length;
        }

        function renderSitesList() {
            const container = document.getElementById('sites-list-container');
            if(projectsData.length === 0) {
                container.innerHTML = \`
                    <div class="col-span-full py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <i class="fas fa-solar-panel text-3xl text-slate-300 mb-3"></i>
                        <p class="text-slate-500 font-medium">Aucun site associé à ce client.</p>
                        <a href="/crm/projects/create?client_id=\${clientId}" class="text-blue-600 font-bold hover:underline mt-2 inline-block">Créer un site</a>
                    </div>
                \`;
                return;
            }

            container.innerHTML = projectsData.map(p => {
                const pInterventions = interventionsData.filter(i => i.project_id === p.id).length;
                return \`
                    <a href="/crm/projects/detail?id=\${p.id}" class="group block bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h4 class="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">\${p.project_name}</h4>
                                <p class="text-xs text-slate-500 mt-1"><i class="fas fa-map-pin mr-1"></i> \${p.address_city || 'Ville inconnue'}</p>
                            </div>
                            <span class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                <i class="fas fa-chevron-right text-xs"></i>
                            </span>
                        </div>
                        <div class="flex items-center gap-4 text-xs font-medium text-slate-600 border-t border-slate-100 pt-3">
                            <span class="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                                <i class="fas fa-bolt text-amber-500"></i> \${p.total_power_kwp || '?'} kWp
                            </span>
                             <span class="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                                <i class="fas fa-th text-slate-400"></i> \${p.module_count || '?'} modules
                            </span>
                             <span class="ml-auto text-slate-400">
                                \${pInterventions} mission(s)
                            </span>
                        </div>
                    </a>
                \`;
            }).join('');
        }

        function renderInterventionsList() {
            const container = document.getElementById('interventions-list-container');
            if(interventionsData.length === 0) {
                container.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500 italic">Aucune intervention planifiée ou réalisée.</td></tr>';
                return;
            }

            container.innerHTML = interventionsData.map(i => {
                const project = projectsData.find(p => p.id === i.project_id);
                return \`
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4 text-sm font-bold text-slate-700">\${new Date(i.intervention_date).toLocaleDateString('fr-FR')}</td>
                        <td class="px-6 py-4">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-800">
                                \${i.intervention_type}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-slate-600">\${project ? project.project_name : 'Site inconnu'}</td>
                        <td class="px-6 py-4 text-sm text-slate-600">\${i.technician_name || 'Non assigné'}</td>
                        <td class="px-6 py-4">
                            <span class="text-xs font-bold \${i.status === 'completed' ? 'text-green-600' : 'text-slate-500'}">
                                \${i.status === 'completed' ? 'Terminée' : i.status}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <a href="/planning/detail?id=\${i.id}" class="text-slate-400 hover:text-blue-600 font-bold text-sm">Voir</a>
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        function renderAuditsList() {
            const container = document.getElementById('audits-list-container');
            if(auditsData.length === 0) {
                container.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-slate-500 italic">Aucun rapport d\\'audit généré.</td></tr>';
                return;
            }
             container.innerHTML = auditsData.map(a => {
                const intervention = interventionsData.find(i => i.id === a.intervention_id);
                const project = intervention ? projectsData.find(p => p.id === intervention.project_id) : null;
                return \`
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4 text-sm font-bold text-slate-700">\${new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                        <td class="px-6 py-4">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-purple-100 text-purple-800">
                                EL
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-slate-600">\${project ? project.project_name : '-'}</td>
                        <td class="px-6 py-4 text-sm text-slate-600">\${a.modules_diagnosed || 0} / \${a.total_modules || 0}</td>
                        <td class="px-6 py-4 text-right">
                            <a href="/el/audit?token=\${a.audit_token}" target="_blank" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-bold text-xs transition-colors">
                                <i class="fas fa-file-pdf"></i> Rapport
                            </a>
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        // --- TABS LOGIC ---
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Reset styling
                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.remove('active', 'border-blue-600', 'text-blue-600', 'bg-slate-50');
                    b.classList.add('border-transparent', 'text-slate-500');
                });
                
                // Active styling
                btn.classList.add('active', 'border-blue-600', 'text-blue-600', 'bg-slate-50');
                btn.classList.remove('border-transparent', 'text-slate-500');

                // Switch content
                const target = btn.dataset.target;
                document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById('tab-' + target).classList.remove('hidden');
            });
        });

        // --- DELETE LOGIC ---
        document.getElementById('delete-client-btn').addEventListener('click', async () => {
             if(!confirm('Attention ! Cette action est irréversible.\\n\\nLa suppression du client entraînera la perte de tous les historiques, audits et données associées.\\n\\nConfirmer la suppression ?')) return;

             try {
                const res = await fetch(\`/api/crm/clients/\${clientId}\`, { method: 'DELETE' });
                const data = await res.json();
                if(data.success) window.location.href = '/crm/clients';
                else alert('Erreur: ' + data.error);
             } catch(e) {
                 console.error(e);
                 alert('Erreur serveur');
             }
        });

        // START
        init();
    </script>
  `;

  return getLayout('Fiche Client', content, 'clients');
}
