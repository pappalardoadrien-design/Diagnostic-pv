// ============================================================================
// PAGE GESTION SOUS-TRAITANTS - LISTE ET CRUD
// ============================================================================
// Interface complète gestion partenaires sous-traitants
// CRUD, missions, disponibilités, notations
// ============================================================================

export function getSubcontractorsListPage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gestion Sous-Traitants - DiagPV</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white min-h-screen font-bold">
        <div class="container mx-auto p-6">
            <!-- En-tête -->
            <header class="mb-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <a href="/crm/dashboard" class="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded font-bold">
                            <i class="fas fa-arrow-left mr-2"></i>Retour Dashboard
                        </a>
                        <div>
                            <h1 class="text-4xl font-black text-purple-400">
                                <i class="fas fa-user-tie mr-3"></i>
                                GESTION SOUS-TRAITANTS
                            </h1>
                            <p class="text-gray-400 mt-1">Partenaires & Experts Externes</p>
                        </div>
                    </div>
                    <button id="btnAddSubcontractor" class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-black text-xl">
                        <i class="fas fa-plus mr-2"></i>
                        NOUVEAU SOUS-TRAITANT
                    </button>
                </div>
            </header>
            
            <!-- Statistiques Rapides -->
            <div class="grid md:grid-cols-5 gap-4 mb-8">
                <div class="bg-gradient-to-br from-purple-900 to-purple-700 rounded-lg p-4 border-2 border-purple-400">
                    <div class="text-center">
                        <i class="fas fa-user-tie text-3xl text-purple-200 mb-2"></i>
                        <p class="text-3xl font-black" id="stat-total">0</p>
                        <p class="text-purple-200">Total</p>
                    </div>
                </div>
                <div class="bg-gradient-to-br from-green-900 to-green-700 rounded-lg p-4 border-2 border-green-400">
                    <div class="text-center">
                        <i class="fas fa-check-circle text-3xl text-green-200 mb-2"></i>
                        <p class="text-3xl font-black" id="stat-active">0</p>
                        <p class="text-green-200">Actifs</p>
                    </div>
                </div>
                <div class="bg-gradient-to-br from-yellow-900 to-yellow-700 rounded-lg p-4 border-2 border-yellow-400">
                    <div class="text-center">
                        <i class="fas fa-tasks text-3xl text-yellow-200 mb-2"></i>
                        <p class="text-3xl font-black" id="stat-missions">0</p>
                        <p class="text-yellow-200">Missions</p>
                    </div>
                </div>
                <div class="bg-gradient-to-br from-orange-900 to-orange-700 rounded-lg p-4 border-2 border-orange-400">
                    <div class="text-center">
                        <i class="fas fa-star text-3xl text-orange-200 mb-2"></i>
                        <p class="text-3xl font-black" id="stat-avg-rating">-</p>
                        <p class="text-orange-200">Note Moy.</p>
                    </div>
                </div>
                <div class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-4 border-2 border-blue-400">
                    <div class="text-center">
                        <i class="fas fa-euro-sign text-3xl text-blue-200 mb-2"></i>
                        <p class="text-3xl font-black" id="stat-avg-rate">-</p>
                        <p class="text-blue-200">TJ Moyen</p>
                    </div>
                </div>
            </div>
            
            <!-- Barre de recherche et filtres -->
            <div class="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
                <div class="grid md:grid-cols-4 gap-4">
                    <div class="md:col-span-2">
                        <input type="text" id="searchInput" placeholder="Rechercher par nom, email, spécialité..." 
                               class="w-full bg-black border-2 border-gray-600 rounded-lg px-4 py-3 focus:border-purple-400 focus:outline-none">
                    </div>
                    <select id="filterStatus" class="bg-black border-2 border-gray-600 rounded-lg px-4 py-3">
                        <option value="">Tous les statuts</option>
                        <option value="active">Actifs</option>
                        <option value="inactive">Inactifs</option>
                    </select>
                    <select id="filterSpecialty" class="bg-black border-2 border-gray-600 rounded-lg px-4 py-3">
                        <option value="">Toutes spécialités</option>
                        <option value="EL">Électroluminescence</option>
                        <option value="IV">Courbes I-V</option>
                        <option value="THERMOGRAPHY">Thermographie</option>
                        <option value="ELECTRICAL">Électrique</option>
                    </select>
                </div>
            </div>
            
            <!-- Liste Sous-Traitants -->
            <div class="bg-gray-900 rounded-lg p-6 border-2 border-purple-400">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-black">
                        <i class="fas fa-list mr-2 text-purple-400"></i>
                        LISTE DES SOUS-TRAITANTS
                    </h2>
                    <button id="btnExportCSV" class="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded font-bold">
                        <i class="fas fa-file-csv mr-2"></i>
                        Export CSV
                    </button>
                </div>
                
                <div id="subcontractors-table" class="overflow-x-auto">
                    <div class="text-center text-gray-400 py-8">
                        <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                        <p>Chargement des sous-traitants...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal Ajout/Édition Sous-Traitant -->
        <div id="modalSubcontractor" class="fixed inset-0 bg-black bg-opacity-75 hidden items-center justify-center z-50">
            <div class="bg-gray-900 rounded-lg p-8 max-w-4xl w-full mx-4 border-2 border-purple-400 max-h-screen overflow-y-auto">
                <h3 class="text-2xl font-black mb-6 text-purple-400" id="modalTitle">
                    <i class="fas fa-user-plus mr-2"></i>
                    NOUVEAU SOUS-TRAITANT
                </h3>
                
                <form id="subcontractorForm" class="space-y-4">
                    <input type="hidden" id="subcontractor-id">
                    
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block font-bold mb-2">Entreprise * :</label>
                            <input type="text" id="company-name" required 
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                        </div>
                        <div>
                            <label class="block font-bold mb-2">Contact * :</label>
                            <input type="text" id="contact-name" required 
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block font-bold mb-2">Email * :</label>
                            <input type="email" id="contact-email" required 
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                        </div>
                        <div>
                            <label class="block font-bold mb-2">Téléphone :</label>
                            <input type="tel" id="contact-phone" 
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block font-bold mb-2">Spécialités (maintenir Ctrl pour sélection multiple) * :</label>
                        <select id="specialties" multiple required 
                                class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2 h-32">
                            <option value="EL">Électroluminescence (EL)</option>
                            <option value="IV">Courbes I-V</option>
                            <option value="THERMOGRAPHY">Thermographie Drone/Sol</option>
                            <option value="ELECTRICAL">Mesures Électriques</option>
                            <option value="VISUAL">Inspections Visuelles</option>
                            <option value="MECHANICAL">Audits Mécaniques</option>
                        </select>
                        <p class="text-xs text-gray-400 mt-1">Maintenez Ctrl (Cmd sur Mac) pour sélectionner plusieurs</p>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-4">
                        <div>
                            <label class="block font-bold mb-2">Tarif Horaire (€/h) :</label>
                            <input type="number" id="hourly-rate" step="0.01" min="0"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                        </div>
                        <div>
                            <label class="block font-bold mb-2">Tarif Journalier (€/j) :</label>
                            <input type="number" id="daily-rate" step="0.01" min="0"
                                   class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                        </div>
                        <div>
                            <label class="block font-bold mb-2">Statut :</label>
                            <select id="status" class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2">
                                <option value="active">Actif</option>
                                <option value="inactive">Inactif</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block font-bold mb-2">Notes :</label>
                        <textarea id="notes" rows="3" 
                                  class="w-full bg-black border-2 border-gray-600 rounded px-3 py-2"></textarea>
                    </div>
                    
                    <div class="flex gap-4 pt-4">
                        <button type="submit" class="flex-1 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-black">
                            <i class="fas fa-save mr-2"></i>
                            ENREGISTRER
                        </button>
                        <button type="button" id="btnCancel" class="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-black">
                            <i class="fas fa-times mr-2"></i>
                            ANNULER
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let allSubcontractors = []
            let allMissions = []
            
            // Charger les sous-traitants
            async function loadSubcontractors() {
                try {
                    const response = await axios.get('/api/subcontractors')
                    allSubcontractors = response.data.subcontractors || []
                    
                    // Stats
                    document.getElementById('stat-total').textContent = allSubcontractors.length
                    document.getElementById('stat-active').textContent = allSubcontractors.filter(s => s.status === 'active').length
                    
                    // Note moyenne
                    const avgRating = allSubcontractors.reduce((sum, s) => sum + (s.rating || 0), 0) / (allSubcontractors.length || 1)
                    document.getElementById('stat-avg-rating').textContent = avgRating.toFixed(1)
                    
                    // TJ moyen
                    const rates = allSubcontractors.filter(s => s.daily_rate).map(s => s.daily_rate)
                    const avgRate = rates.length > 0 ? rates.reduce((sum, r) => sum + r, 0) / rates.length : 0
                    document.getElementById('stat-avg-rate').textContent = avgRate > 0 ? avgRate.toFixed(0) + '€' : '-'
                    
                    // Charger missions
                    await loadMissions()
                    
                    renderSubcontractors(allSubcontractors)
                } catch (error) {
                    console.error('Erreur:', error)
                    document.getElementById('subcontractors-table').innerHTML = '<p class="text-red-400 text-center py-8">Erreur de chargement</p>'
                }
            }
            
            // Charger missions
            async function loadMissions() {
                try {
                    const response = await axios.get('/api/subcontractors/missions')
                    allMissions = response.data.missions || []
                    document.getElementById('stat-missions').textContent = allMissions.length
                } catch (error) {
                    console.error('Missions error:', error)
                }
            }
            
            // Render table
            function renderSubcontractors(subcontractors) {
                const container = document.getElementById('subcontractors-table')
                
                if (subcontractors.length === 0) {
                    container.innerHTML = '<p class="text-gray-400 text-center py-8">Aucun sous-traitant trouvé</p>'
                    return
                }
                
                container.innerHTML = \`
                    <table class="w-full">
                        <thead>
                            <tr class="border-b-2 border-gray-700">
                                <th class="text-left py-3 px-4">Entreprise</th>
                                <th class="text-left py-3 px-4">Contact</th>
                                <th class="text-left py-3 px-4">Spécialités</th>
                                <th class="text-center py-3 px-4">TJ</th>
                                <th class="text-center py-3 px-4">Note</th>
                                <th class="text-center py-3 px-4">Missions</th>
                                <th class="text-center py-3 px-4">Statut</th>
                                <th class="text-center py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${subcontractors.map(sub => {
                                const specialties = JSON.parse(sub.specialties || '[]')
                                const missions = allMissions.filter(m => m.subcontractor_id === sub.id).length
                                
                                return \`
                                <tr class="border-b border-gray-800 hover:bg-gray-800">
                                    <td class="py-3 px-4 font-bold text-purple-300">\${sub.company_name}</td>
                                    <td class="py-3 px-4">
                                        <div class="text-sm">
                                            <div>\${sub.contact_name}</div>
                                            <div class="text-gray-400 text-xs">\${sub.contact_email}</div>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4">
                                        <div class="flex flex-wrap gap-1">
                                            \${specialties.map(s => \`
                                                <span class="bg-blue-600 px-2 py-1 rounded text-xs">\${s}</span>
                                            \`).join('')}
                                        </div>
                                    </td>
                                    <td class="py-3 px-4 text-center font-bold text-blue-300">
                                        \${sub.daily_rate ? sub.daily_rate + '€' : '-'}
                                    </td>
                                    <td class="py-3 px-4 text-center">
                                        <div class="flex items-center justify-center gap-1">
                                            <i class="fas fa-star text-yellow-400"></i>
                                            <span class="font-bold">\${(sub.rating || 0).toFixed(1)}</span>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4 text-center font-bold text-yellow-400">
                                        \${missions}
                                    </td>
                                    <td class="py-3 px-4 text-center">
                                        <span class="px-3 py-1 rounded-full text-xs font-bold \${sub.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}">
                                            \${sub.status === 'active' ? 'ACTIF' : 'INACTIF'}
                                        </span>
                                    </td>
                                    <td class="py-3 px-4">
                                        <div class="flex gap-2 justify-center">
                                            <button onclick="viewSubcontractor(\${sub.id})" class="bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded text-sm" title="Voir détails">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button onclick="editSubcontractor(\${sub.id})" class="bg-yellow-700 hover:bg-yellow-600 px-3 py-1 rounded text-sm" title="Modifier">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="deleteSubcontractor(\${sub.id})" class="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-sm" title="Supprimer">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                \`
                            }).join('')}
                        </tbody>
                    </table>
                \`
            }
            
            // Recherche et filtres
            function applyFilters() {
                const search = document.getElementById('searchInput').value.toLowerCase()
                const status = document.getElementById('filterStatus').value
                const specialty = document.getElementById('filterSpecialty').value
                
                let filtered = allSubcontractors.filter(sub => {
                    const specialties = JSON.parse(sub.specialties || '[]')
                    
                    const matchSearch = !search || 
                        sub.company_name?.toLowerCase().includes(search) ||
                        sub.contact_name?.toLowerCase().includes(search) ||
                        sub.contact_email?.toLowerCase().includes(search) ||
                        specialties.some(s => s.toLowerCase().includes(search))
                    
                    const matchStatus = !status || sub.status === status
                    const matchSpecialty = !specialty || specialties.includes(specialty)
                    
                    return matchSearch && matchStatus && matchSpecialty
                })
                
                renderSubcontractors(filtered)
            }
            
            document.getElementById('searchInput').addEventListener('input', applyFilters)
            document.getElementById('filterStatus').addEventListener('change', applyFilters)
            document.getElementById('filterSpecialty').addEventListener('change', applyFilters)
            
            // Modal
            document.getElementById('btnAddSubcontractor').addEventListener('click', () => {
                document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-plus mr-2"></i>NOUVEAU SOUS-TRAITANT'
                document.getElementById('subcontractorForm').reset()
                document.getElementById('subcontractor-id').value = ''
                document.getElementById('modalSubcontractor').classList.remove('hidden')
                document.getElementById('modalSubcontractor').classList.add('flex')
            })
            
            document.getElementById('btnCancel').addEventListener('click', () => {
                document.getElementById('modalSubcontractor').classList.add('hidden')
                document.getElementById('modalSubcontractor').classList.remove('flex')
            })
            
            // View
            function viewSubcontractor(id) {
                const sub = allSubcontractors.find(s => s.id === id)
                if (!sub) return
                
                const specialties = JSON.parse(sub.specialties || '[]')
                const missions = allMissions.filter(m => m.subcontractor_id === id).length
                
                alert('Détails Sous-Traitant:\\n\\n' +
                      'Entreprise: ' + sub.company_name + '\\n' +
                      'Contact: ' + sub.contact_name + '\\n' +
                      'Email: ' + sub.contact_email + '\\n' +
                      'Téléphone: ' + (sub.contact_phone || '-') + '\\n' +
                      'Spécialités: ' + specialties.join(', ') + '\\n' +
                      'TJ: ' + (sub.daily_rate ? sub.daily_rate + '€' : '-') + '\\n' +
                      'Note: ' + (sub.rating || 0).toFixed(1) + '/5\\n' +
                      'Missions: ' + missions + '\\n' +
                      'Statut: ' + sub.status)
            }
            
            // Edit
            function editSubcontractor(id) {
                const sub = allSubcontractors.find(s => s.id === id)
                if (!sub) return
                
                const specialties = JSON.parse(sub.specialties || '[]')
                
                document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit mr-2"></i>MODIFIER SOUS-TRAITANT'
                document.getElementById('subcontractor-id').value = sub.id
                document.getElementById('company-name').value = sub.company_name || ''
                document.getElementById('contact-name').value = sub.contact_name || ''
                document.getElementById('contact-email').value = sub.contact_email || ''
                document.getElementById('contact-phone').value = sub.contact_phone || ''
                document.getElementById('hourly-rate').value = sub.hourly_rate || ''
                document.getElementById('daily-rate').value = sub.daily_rate || ''
                document.getElementById('status').value = sub.status || 'active'
                document.getElementById('notes').value = sub.notes || ''
                
                // Sélectionner spécialités
                const select = document.getElementById('specialties')
                Array.from(select.options).forEach(option => {
                    option.selected = specialties.includes(option.value)
                })
                
                document.getElementById('modalSubcontractor').classList.remove('hidden')
                document.getElementById('modalSubcontractor').classList.add('flex')
            }
            
            // Delete
            async function deleteSubcontractor(id) {
                if (!confirm('Voulez-vous vraiment supprimer ce sous-traitant ?')) return
                
                try {
                    await axios.delete(\`/api/subcontractors/\${id}\`)
                    alert('Sous-traitant supprimé avec succès')
                    loadSubcontractors()
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || error.message))
                }
            }
            
            // Submit
            document.getElementById('subcontractorForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const id = document.getElementById('subcontractor-id').value
                const select = document.getElementById('specialties')
                const specialties = Array.from(select.selectedOptions).map(o => o.value)
                
                const data = {
                    company_name: document.getElementById('company-name').value,
                    contact_name: document.getElementById('contact-name').value,
                    contact_email: document.getElementById('contact-email').value,
                    contact_phone: document.getElementById('contact-phone').value,
                    specialties: JSON.stringify(specialties),
                    hourly_rate: parseFloat(document.getElementById('hourly-rate').value) || null,
                    daily_rate: parseFloat(document.getElementById('daily-rate').value) || null,
                    status: document.getElementById('status').value,
                    notes: document.getElementById('notes').value
                }
                
                try {
                    if (id) {
                        await axios.put(\`/api/subcontractors/\${id}\`, data)
                    } else {
                        await axios.post('/api/subcontractors', data)
                    }
                    
                    document.getElementById('modalSubcontractor').classList.add('hidden')
                    document.getElementById('modalSubcontractor').classList.remove('flex')
                    loadSubcontractors()
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || error.message))
                }
            })
            
            // Export CSV
            document.getElementById('btnExportCSV').addEventListener('click', () => {
                const csv = 'Entreprise,Contact,Email,Téléphone,Spécialités,TJ,Note,Missions,Statut\\n' +
                    allSubcontractors.map(sub => {
                        const specialties = JSON.parse(sub.specialties || '[]').join(';')
                        const missions = allMissions.filter(m => m.subcontractor_id === sub.id).length
                        return \`"\${sub.company_name}","\${sub.contact_name}","\${sub.contact_email}","\${sub.contact_phone || ''}","\${specialties}","\${sub.daily_rate || ''}","\${sub.rating || 0}","\${missions}","\${sub.status}"\`
                    }).join('\\n')
                
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'sous_traitants_diagpv.csv'
                a.click()
            })
            
            // Init
            loadSubcontractors()
        </script>
    </body>
    </html>
  `
}
