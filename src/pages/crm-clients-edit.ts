// Page Modifier Client CRM - Formulaire d'édition pré-rempli
// Validation, sauvegarde et retour vers détail

export function getCrmClientsEditPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modifier Client - CRM DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f8fafc; }
        .form-section { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .form-input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
        .form-input:focus { outline: none; border-color: #2563eb; ring: 2px; ring-color: #93c5fd; }
        .form-select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
        .form-textarea { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; min-height: 100px; }
        .required { color: #dc2626; }
        .error-message { color: #dc2626; font-size: 12px; margin-top: 4px; display: none; }
    </style>
</head>
<body class="min-h-screen">

    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a id="back-link" href="#" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-edit text-blue-600 mr-2"></i>
                        Modifier Client
                    </h1>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <form id="edit-client-form">

            <!-- Informations Société -->
            <div class="form-section">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-building text-blue-600 mr-2"></i>
                    Informations Société
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-group md:col-span-2">
                        <label for="company_name" class="form-label">
                            Raison sociale <span class="required">*</span>
                        </label>
                        <input type="text" id="company_name" class="form-input" required>
                        <p class="error-message" id="error-company_name">Ce champ est requis</p>
                    </div>

                    <div class="form-group">
                        <label for="siret" class="form-label">SIRET</label>
                        <input type="text" id="siret" class="form-input" maxlength="14" placeholder="12345678901234">
                        <p class="error-message" id="error-siret">Format invalide (14 chiffres)</p>
                    </div>

                    <div class="form-group">
                        <label for="vat_number" class="form-label">TVA Intracommunautaire</label>
                        <input type="text" id="vat_number" class="form-input" placeholder="FR12345678901">
                    </div>

                    <div class="form-group">
                        <label for="client_type" class="form-label">Type de client</label>
                        <select id="client_type" class="form-select">
                            <option value="">-- Sélectionner --</option>
                            <option value="Particulier">Particulier</option>
                            <option value="Professionnel">Professionnel</option>
                            <option value="Entreprise">Entreprise</option>
                            <option value="Collectivité">Collectivité</option>
                            <option value="Assureur">Assureur</option>
                            <option value="Bureau d'études">Bureau d'études</option>
                            <option value="Installateur">Installateur</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="status" class="form-label">Statut <span class="required">*</span></label>
                        <select id="status" class="form-select" required>
                            <option value="prospect">Prospect</option>
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Contact Principal -->
            <div class="form-section">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-user text-blue-600 mr-2"></i>
                    Contact Principal
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="contact_name" class="form-label">Nom complet</label>
                        <input type="text" id="contact_name" class="form-input" placeholder="Jean Dupont">
                    </div>

                    <div class="form-group">
                        <label for="contact_role" class="form-label">Fonction / Rôle</label>
                        <input type="text" id="contact_role" class="form-input" placeholder="Responsable technique">
                    </div>

                    <div class="form-group">
                        <label for="contact_email" class="form-label">Email</label>
                        <input type="email" id="contact_email" class="form-input" placeholder="contact@example.com">
                        <p class="error-message" id="error-contact_email">Email invalide</p>
                    </div>

                    <div class="form-group">
                        <label for="contact_phone" class="form-label">Téléphone</label>
                        <input type="tel" id="contact_phone" class="form-input" placeholder="06 12 34 56 78">
                    </div>
                </div>
            </div>

            <!-- Adresse -->
            <div class="form-section">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-map-marker-alt text-blue-600 mr-2"></i>
                    Adresse
                </h2>
                
                <div class="grid grid-cols-1 gap-4">
                    <div class="form-group">
                        <label for="address_street" class="form-label">Rue</label>
                        <input type="text" id="address_street" class="form-input" placeholder="123 rue de la République">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="form-group">
                            <label for="address_postal_code" class="form-label">Code postal</label>
                            <input type="text" id="address_postal_code" class="form-input" maxlength="5" placeholder="31000">
                        </div>

                        <div class="form-group md:col-span-2">
                            <label for="address_city" class="form-label">Ville</label>
                            <input type="text" id="address_city" class="form-input" placeholder="Toulouse">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Notes -->
            <div class="form-section">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-sticky-note text-blue-600 mr-2"></i>
                    Notes et Remarques
                </h2>
                
                <div class="form-group">
                    <label for="notes" class="form-label">Notes internes</label>
                    <textarea id="notes" class="form-textarea" placeholder="Informations complémentaires..."></textarea>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3">
                <a id="cancel-btn" href="#" class="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition">
                    Annuler
                </a>
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition">
                    <i class="fas fa-save mr-2"></i>
                    Enregistrer les modifications
                </button>
            </div>

        </form>

    </main>

    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('id');

        if (!clientId) {
            alert('ID client manquant');
            window.location.href = '/crm/clients';
        }

        // Set back links
        document.getElementById('back-link').href = \`/crm/clients/detail?id=\${clientId}\`;
        document.getElementById('cancel-btn').href = \`/crm/clients/detail?id=\${clientId}\`;

        // Load client data and populate form
        async function loadClient() {
            const response = await fetch(\`/api/crm/clients/\${clientId}\`);
            if (!response.ok) {
                alert('Client non trouvé');
                window.location.href = '/crm/clients';
                return;
            }

            const data = await response.json();
            const client = data.client;

            // Populate form fields
            document.getElementById('company_name').value = client.company_name || '';
            document.getElementById('siret').value = client.siret || '';
            document.getElementById('vat_number').value = client.vat_number || '';
            document.getElementById('client_type').value = client.client_type || '';
            document.getElementById('status').value = client.status || 'prospect';
            document.getElementById('contact_name').value = client.contact_name || '';
            document.getElementById('contact_role').value = client.contact_role || '';
            document.getElementById('contact_email').value = client.contact_email || '';
            document.getElementById('contact_phone').value = client.contact_phone || '';
            document.getElementById('address_street').value = client.address_street || '';
            document.getElementById('address_postal_code').value = client.address_postal_code || '';
            document.getElementById('address_city').value = client.address_city || '';
            document.getElementById('notes').value = client.notes || '';
        }

        // Form validation
        function validateForm() {
            let isValid = true;

            // Company name required
            const companyName = document.getElementById('company_name');
            if (!companyName.value.trim()) {
                document.getElementById('error-company_name').style.display = 'block';
                companyName.style.borderColor = '#dc2626';
                isValid = false;
            } else {
                document.getElementById('error-company_name').style.display = 'none';
                companyName.style.borderColor = '#d1d5db';
            }

            // SIRET format (14 digits) if provided
            const siret = document.getElementById('siret');
            if (siret.value && !/^\\d{14}$/.test(siret.value)) {
                document.getElementById('error-siret').style.display = 'block';
                siret.style.borderColor = '#dc2626';
                isValid = false;
            } else {
                document.getElementById('error-siret').style.display = 'none';
                siret.style.borderColor = '#d1d5db';
            }

            // Email format if provided
            const email = document.getElementById('contact_email');
            if (email.value && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.value)) {
                document.getElementById('error-contact_email').style.display = 'block';
                email.style.borderColor = '#dc2626';
                isValid = false;
            } else {
                document.getElementById('error-contact_email').style.display = 'none';
                email.style.borderColor = '#d1d5db';
            }

            return isValid;
        }

        // Form submission
        document.getElementById('edit-client-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateForm()) {
                alert('Veuillez corriger les erreurs dans le formulaire');
                return;
            }

            const clientData = {
                company_name: document.getElementById('company_name').value.trim(),
                siret: document.getElementById('siret').value.trim() || null,
                vat_number: document.getElementById('vat_number').value.trim() || null,
                client_type: document.getElementById('client_type').value || null,
                status: document.getElementById('status').value,
                contact_name: document.getElementById('contact_name').value.trim() || null,
                contact_role: document.getElementById('contact_role').value.trim() || null,
                contact_email: document.getElementById('contact_email').value.trim() || null,
                contact_phone: document.getElementById('contact_phone').value.trim() || null,
                address_street: document.getElementById('address_street').value.trim() || null,
                address_postal_code: document.getElementById('address_postal_code').value.trim() || null,
                address_city: document.getElementById('address_city').value.trim() || null,
                notes: document.getElementById('notes').value.trim() || null
            };

            try {
                const response = await fetch(\`/api/crm/clients/\${clientId}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clientData)
                });

                const data = await response.json();

                if (data.success) {
                    alert('Client modifié avec succès');
                    window.location.href = \`/crm/clients/detail?id=\${clientId}\`;
                } else {
                    alert('Erreur: ' + (data.error || 'Impossible de modifier le client'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Erreur réseau. Veuillez réessayer.');
            }
        });

        // Initialize
        loadClient();
    </script>

</body>
</html>
  `;
}
