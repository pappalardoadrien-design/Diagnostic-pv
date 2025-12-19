import { getLayout } from './layout.js';

export function getCrmClientsCreatePage() {
  const content = `
    <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-black text-slate-900">Nouveau Client</h1>
            <p class="text-slate-500 mt-1">Ajouter une entreprise ou un particulier à la base de données</p>
        </div>

        <form id="createClientForm" class="space-y-8">
            
            <!-- Informations Entreprise -->
            <div class="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <span class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-sm">1</span>
                    Identité
                </h2>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Nom / Raison Sociale *</label>
                        <input type="text" id="company_name" required placeholder="Ex: Solar Energy SAS" 
                               class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Type</label>
                        <select id="client_type" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="company">Entreprise</option>
                            <option value="individual">Particulier</option>
                            <option value="collectivity">Collectivité</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Statut</label>
                        <select id="status" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="active">Actif</option>
                            <option value="prospect">Prospect</option>
                            <option value="inactive">Inactif</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">SIRET</label>
                        <input type="text" id="siret" maxlength="14" placeholder="14 chiffres" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">TVA Intra.</label>
                        <input type="text" id="vat_number" placeholder="FR..." class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono">
                    </div>
                </div>
            </div>

            <!-- Contact Principal -->
            <div class="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <span class="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 text-sm">2</span>
                    Contact Principal
                </h2>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Nom Complet</label>
                        <input type="text" id="main_contact_name" placeholder="Ex: Jean Dupont" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Email</label>
                        <input type="email" id="main_contact_email" placeholder="email@exemple.com" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Téléphone</label>
                        <input type="tel" id="main_contact_phone" placeholder="06..." class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    </div>
                    
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Fonction</label>
                        <input type="text" id="main_contact_role" placeholder="Ex: Responsable Maintenance" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    </div>
                </div>
            </div>

            <!-- Adresse -->
            <div class="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <span class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 text-sm">3</span>
                    Coordonnées
                </h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Adresse</label>
                        <input type="text" id="address" placeholder="N° et Rue" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Code Postal</label>
                            <input type="text" id="postal_code" placeholder="CP" maxlength="5" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Ville</label>
                            <input type="text" id="city" placeholder="Ville" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Notes -->
            <div class="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <span class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mr-3 text-sm">4</span>
                    Notes Internes
                </h2>
                <textarea id="notes" rows="3" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" placeholder="Informations complémentaires..."></textarea>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-4 pt-4 pb-12">
                <a href="/crm/clients" class="px-6 py-3 text-slate-500 font-bold hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    Annuler
                </a>
                <button type="submit" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-200 transition-all transform hover:-translate-y-1">
                    Créer le client
                </button>
            </div>

        </form>
    </div>

    <script>
        // Gestion paramètres URL
        const urlParams = new URLSearchParams(window.location.search);
        const statusParam = urlParams.get('status');
        if (statusParam) {
            const select = document.getElementById('status');
            if (select.querySelector(\`option[value="\${statusParam}"]\`)) {
                select.value = statusParam;
            }
        }

        // Formatage SIRET & CP
        document.getElementById('siret').addEventListener('input', e => e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 14));
        document.getElementById('postal_code').addEventListener('input', e => e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 5));

        // Submit
        document.getElementById('createClientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Création...';

            const formData = {
                company_name: document.getElementById('company_name').value,
                siret: document.getElementById('siret').value || null,
                vat_number: document.getElementById('vat_number').value || null,
                client_type: document.getElementById('client_type').value,
                status: document.getElementById('status').value,
                main_contact_name: document.getElementById('main_contact_name').value || null,
                main_contact_email: document.getElementById('main_contact_email').value || null,
                main_contact_phone: document.getElementById('main_contact_phone').value || null,
                main_contact_role: document.getElementById('main_contact_role').value || null,
                address: document.getElementById('address').value || null,
                postal_code: document.getElementById('postal_code').value || null,
                city: document.getElementById('city').value || null,
                notes: document.getElementById('notes').value || null
            };

            try {
                const response = await fetch('/api/crm/clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    // Redirection vers le détail
                    window.location.href = \`/crm/clients/detail?id=\${data.client_id}\`;
                } else {
                    alert('Erreur: ' + (data.message || data.error));
                    btn.disabled = false;
                    btn.innerText = originalText;
                }
            } catch (error) {
                console.error(error);
                alert('Erreur réseau');
                btn.disabled = false;
                btn.innerText = originalText;
            }
        });
    </script>
  `;

  return getLayout('Nouveau Client', content, 'clients');
}
