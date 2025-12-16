// Page Création Client CRM - Formulaire complet avec validation

export function getCrmClientsCreatePage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau Client - CRM DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a href="/crm/clients" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-plus-circle text-blue-600 mr-2"></i>
                        Nouveau Client
                    </h1>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <form id="createClientForm" class="bg-white rounded-lg shadow-sm p-8 space-y-8">
            
            <!-- Section Informations Entreprise -->
            <div>
                <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-building text-blue-600 mr-2"></i>
                    Informations Entreprise
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                        <label class="block text-sm font-semibold text-gray-900 mb-2">
                            Nom de l'entreprise *
                        </label>
                        <input 
                            type="text" 
                            id="company_name" 
                            name="company_name"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="TotalEnergies"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-900 mb-2">
                            SIRET
                        </label>
                        <input 
                            type="text" 
                            id="siret" 
                            name="siret"
                            maxlength="14"
                            class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="12345678901234"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-900 mb-2">
                            TVA Intracommunautaire
                        </label>
                        <input 
                            type="text" 
                            id="vat_number" 
                            name="vat_number"
                            class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="FR12345678901"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-900 mb-2">
                            Type de client *
                        </label>
                        <select 
                            id="client_type" 
                            name="client_type"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="company">Entreprise</option>
                            <option value="individual">Particulier</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-900 mb-2">
                            Statut *
                        </label>
                        <select 
                            id="status" 
                            name="status"
                            required
                            class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="prospect">Prospect</option>
                            <option value="active" selected>Actif</option>
                            <option value="inactive">Inactif</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Section Contact Principal -->
            <div>
                <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-user text-green-600 mr-2"></i>
                    Contact Principal
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-900 mb-2">
                            Nom du contact
                        </label>
                        <input 
                            type="text" 
                            id="main_contact_name" 
                            name="main_contact_name"
                            class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Jean Dupont"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-900 mb-2">
                            Email
                        </label>
                        <input 
                            type="email" 
                            id="main_contact_email" 
                            name="main_contact_email"
                            class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="j.dupont@totalenergies.com"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-900 mb-2">
                            Téléphone
                        </label>
                        <input 
                            type="tel" 
                            id="main_contact_phone" 
                            name="main_contact_phone"
                            class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="06 12 34 56 78"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-900 mb-2">
                            Fonction
                        </label>
                        <input 
                            type="text" 
                            id="main_contact_role" 
                            name="main_contact_role"
                            class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Directeur Technique"
                        >
                    </div>
                </div>
            </div>

            <!-- Section Adresse -->
            <div>
                <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-map-marker-alt text-red-600 mr-2"></i>
                    Adresse Siège Social
                </h2>
                <div class="grid grid-cols-1 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-900 mb-2">
                            Adresse
                        </label>
                        <input 
                            type="text" 
                            id="address" 
                            name="address"
                            class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="2 place Jean Millier"
                        >
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-900 mb-2">
                                Code Postal
                            </label>
                            <input 
                                type="text" 
                                id="postal_code" 
                                name="postal_code"
                                maxlength="5"
                                class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="92400"
                            >
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-semibold text-gray-900 mb-2">
                                Ville
                            </label>
                            <input 
                                type="text" 
                                id="city" 
                                name="city"
                                class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Courbevoie"
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section Notes -->
            <div>
                <label class="block text-sm font-semibold text-gray-900 mb-2">
                    <i class="fas fa-sticky-note text-gray-500 mr-2"></i>
                    Notes / Informations complémentaires
                </label>
                <textarea 
                    id="notes" 
                    name="notes"
                    rows="4"
                    class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Informations complémentaires sur le client..."
                ></textarea>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-6 border-t border-gray-200">
                <a href="/crm/clients" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                    Annuler
                </a>
                <button 
                    type="submit" 
                    class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    <i class="fas fa-check mr-2"></i>
                    Créer le client
                </button>
            </div>
        </form>

    </main>

    <script>
        document.getElementById('createClientForm').addEventListener('submit', async (e) => {
            e.preventDefault();

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
                    alert('Client créé avec succès !');
                    // L'API renvoie { success: true, client_id: 123 }
                    window.location.href = \`/crm/clients/detail?id=\${data.client_id}\`;
                } else {
                    alert('Erreur: ' + data.message);
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de la création du client');
            }
        });

        // Validation SIRET
        document.getElementById('siret').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').substring(0, 14);
        });

        // Validation Code Postal
        document.getElementById('postal_code').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').substring(0, 5);
        });

        // Gestion des paramètres URL (ex: ?status=prospect)
        const urlParams = new URLSearchParams(window.location.search);
        const statusParam = urlParams.get('status');
        
        if (statusParam) {
            const statusSelect = document.getElementById('status');
            if (statusSelect) {
                // Vérifier si l'option existe
                const options = Array.from(statusSelect.options).map(o => o.value);
                if (options.includes(statusParam)) {
                    statusSelect.value = statusParam;
                    
                    // Si c'est un prospect, adapter l'interface
                    if (statusParam === 'prospect') {
                        document.title = 'Nouveau Prospect / Devis - CRM DiagPV';
                        const h1 = document.querySelector('h1');
                        if (h1) {
                            h1.innerHTML = '<i class="fas fa-file-invoice-dollar text-purple-600 mr-2"></i> Nouveau Prospect / Devis';
                        }
                        
                        // Rendre certains champs moins "obligatoires" visuellement (le required reste HTML5)
                        // On pourrait ici alléger le formulaire pour une saisie rapide
                    }
                }
            }
        }
    </script>
</body>
</html>
  `;
}
