/**
 * Page Admin - Gestion Utilisateurs
 * Interface web pour CRUD utilisateurs
 */

export function getAdminUsersPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Gestion Utilisateurs - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #000; color: #fff; min-height: 100vh; }
        .btn-orange { background: linear-gradient(135deg, #ff8c00, #ff6600); }
        .btn-orange:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255,140,0,0.3); }
        .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 50; }
        .modal.active { display: flex; }
        .badge-admin { background: #8b5cf6; }
        .badge-subcontractor { background: #3b82f6; }
        .badge-client { background: #10b981; }
        .badge-auditor { background: #f59e0b; }
    </style>
</head>
<body class="p-6">

    <!-- Header -->
    <div class="max-w-7xl mx-auto mb-8">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-3xl font-bold flex items-center gap-3">
                    <i class="fas fa-users text-orange-500"></i>
                    Gestion Utilisateurs
                </h1>
                <p class="text-gray-400 mt-1">Administration du système d'authentification DiagPV</p>
            </div>
            <div class="flex gap-3">
                <button onclick="window.location.href='/'" class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                    <i class="fas fa-home mr-2"></i>Dashboard
                </button>
                <button onclick="showCreateModal()" class="px-6 py-2 btn-orange text-white rounded font-bold">
                    <i class="fas fa-plus mr-2"></i>Nouvel Utilisateur
                </button>
            </div>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="max-w-7xl mx-auto mb-8">
        <div class="grid grid-cols-4 gap-4" id="stats-cards">
            <div class="bg-gray-800 p-4 rounded-lg">
                <div class="text-gray-400 text-sm">Total</div>
                <div class="text-3xl font-bold" id="stat-total">-</div>
            </div>
            <div class="bg-gray-800 p-4 rounded-lg">
                <div class="text-gray-400 text-sm">Actifs</div>
                <div class="text-3xl font-bold text-green-500" id="stat-active">-</div>
            </div>
            <div class="bg-gray-800 p-4 rounded-lg">
                <div class="text-gray-400 text-sm">Sous-traitants</div>
                <div class="text-3xl font-bold text-blue-500" id="stat-subcontractors">-</div>
            </div>
            <div class="bg-gray-800 p-4 rounded-lg">
                <div class="text-gray-400 text-sm">Activité 7j</div>
                <div class="text-3xl font-bold text-orange-500" id="stat-activity">-</div>
            </div>
        </div>
    </div>

    <!-- Filters -->
    <div class="max-w-7xl mx-auto mb-6">
        <div class="bg-gray-800 p-4 rounded-lg flex gap-4">
            <div class="flex-1">
                <input type="text" id="search" placeholder="🔍 Rechercher (email, nom, entreprise)..." 
                    class="w-full px-4 py-2 bg-gray-700 rounded border-0 text-white">
            </div>
            <select id="filter-role" class="px-4 py-2 bg-gray-700 rounded border-0 text-white">
                <option value="">Tous les rôles</option>
                <option value="admin">Admin</option>
                <option value="subcontractor">Sous-traitant</option>
                <option value="client">Client</option>
                <option value="auditor">Auditeur</option>
            </select>
            <select id="filter-status" class="px-4 py-2 bg-gray-700 rounded border-0 text-white">
                <option value="">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
            </select>
            <button onclick="loadUsers()" class="px-6 py-2 btn-orange text-white rounded">
                <i class="fas fa-filter mr-2"></i>Filtrer
            </button>
        </div>
    </div>

    <!-- Users Table -->
    <div class="max-w-7xl mx-auto">
        <div class="bg-gray-800 rounded-lg overflow-hidden">
            <table class="w-full">
                <thead class="bg-gray-900">
                    <tr>
                        <th class="px-4 py-3 text-left">ID</th>
                        <th class="px-4 py-3 text-left">Utilisateur</th>
                        <th class="px-4 py-3 text-left">Entreprise</th>
                        <th class="px-4 py-3 text-left">Rôle</th>
                        <th class="px-4 py-3 text-left">Statut</th>
                        <th class="px-4 py-3 text-left">Créé le</th>
                        <th class="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody id="users-table-body">
                    <tr>
                        <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                            <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                            <div>Chargement...</div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Modal Create/Edit User -->
    <div id="user-modal" class="modal items-center justify-center">
        <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold" id="modal-title">Nouvel Utilisateur</h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="user-form" class="space-y-4">
                <input type="hidden" id="user-id">
                
                <div>
                    <label class="block text-sm font-semibold mb-2">Email *</label>
                    <input type="email" id="user-email" required 
                        class="w-full px-4 py-2 bg-gray-700 rounded border-0 text-white">
                </div>
                
                <div id="password-field">
                    <label class="block text-sm font-semibold mb-2">Mot de passe *</label>
                    <input type="password" id="user-password" 
                        class="w-full px-4 py-2 bg-gray-700 rounded border-0 text-white">
                    <p class="text-xs text-gray-400 mt-1">Min 8 caractères, 1 maj, 1 min, 1 chiffre, 1 spécial</p>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold mb-2">Nom complet *</label>
                    <input type="text" id="user-fullname" required 
                        class="w-full px-4 py-2 bg-gray-700 rounded border-0 text-white">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold mb-2">Entreprise</label>
                    <input type="text" id="user-company" 
                        class="w-full px-4 py-2 bg-gray-700 rounded border-0 text-white">
                </div>
                
                <div>
                    <label class="block text-sm font-semibold mb-2">Rôle *</label>
                    <select id="user-role" required 
                        class="w-full px-4 py-2 bg-gray-700 rounded border-0 text-white">
                        <option value="subcontractor">Sous-traitant</option>
                        <option value="client">Client</option>
                        <option value="auditor">Auditeur</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                
                <div class="flex items-center gap-2">
                    <input type="checkbox" id="user-must-change" checked 
                        class="w-4 h-4 text-orange-500">
                    <label class="text-sm">Forcer changement mot de passe</label>
                </div>
                
                <div class="flex gap-3 mt-6">
                    <button type="button" onclick="closeModal()" 
                        class="flex-1 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                        Annuler
                    </button>
                    <button type="submit" 
                        class="flex-1 px-4 py-2 btn-orange text-white rounded font-bold">
                        <span id="submit-text">Créer</span>
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let sessionToken = localStorage.getItem('session_token');
        
        // Check auth
        if (!sessionToken) {
            window.location.href = '/login';
        }
        
        // Load initial data
        loadStats();
        loadUsers();
        
        // Filters
        document.getElementById('search').addEventListener('input', () => setTimeout(loadUsers, 300));
        document.getElementById('filter-role').addEventListener('change', loadUsers);
        document.getElementById('filter-status').addEventListener('change', loadUsers);
        
        async function loadStats() {
            try {
                const res = await axios.get('/api/auth/admin/stats');
                const stats = res.data.stats;
                
                document.getElementById('stat-total').textContent = stats.total_users;
                document.getElementById('stat-active').textContent = stats.active_users;
                document.getElementById('stat-activity').textContent = stats.recent_activity_7d;
                
                const subcontractors = stats.by_role.find(r => r.role === 'subcontractor');
                document.getElementById('stat-subcontractors').textContent = subcontractors?.count || 0;
            } catch (err) {
                console.error('Stats error:', err);
            }
        }
        
        async function loadUsers() {
            const search = document.getElementById('search').value;
            const role = document.getElementById('filter-role').value;
            const status = document.getElementById('filter-status').value;
            
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (role) params.append('role', role);
            if (status) params.append('status', status);
            
            try {
                const res = await axios.get('/api/auth/admin/users?' + params.toString());
                const users = res.data.users;
                
                const tbody = document.getElementById('users-table-body');
                
                if (users.length === 0) {
                    tbody.innerHTML = \`
                        <tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">
                            Aucun utilisateur trouvé
                        </td></tr>
                    \`;
                    return;
                }
                
                tbody.innerHTML = users.map(u => \`
                    <tr class="border-t border-gray-700 hover:bg-gray-750">
                        <td class="px-4 py-3">#\${u.id}</td>
                        <td class="px-4 py-3">
                            <div class="font-semibold">\${u.full_name}</div>
                            <div class="text-sm text-gray-400">\${u.email}</div>
                        </td>
                        <td class="px-4 py-3 text-gray-300">\${u.company || '-'}</td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-1 rounded text-xs font-semibold badge-\${u.role}">
                                \${getRoleLabel(u.role)}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-1 rounded text-xs \${u.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}">
                                \${u.is_active ? 'Actif' : 'Inactif'}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-400">
                            \${new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td class="px-4 py-3 text-right">
                            <button onclick="editUser(\${u.id})" class="text-blue-400 hover:text-blue-300 mr-3">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="toggleUser(\${u.id}, \${u.is_active})" class="text-\${u.is_active ? 'red' : 'green'}-400 hover:text-\${u.is_active ? 'red' : 'green'}-300">
                                <i class="fas fa-\${u.is_active ? 'ban' : 'check'}"></i>
                            </button>
                        </td>
                    </tr>
                \`).join('');
                
            } catch (err) {
                console.error('Load users error:', err);
                alert('Erreur chargement utilisateurs');
            }
        }
        
        function getRoleLabel(role) {
            const labels = {
                admin: 'Admin',
                subcontractor: 'Sous-traitant',
                client: 'Client',
                auditor: 'Auditeur'
            };
            return labels[role] || role;
        }
        
        function showCreateModal() {
            document.getElementById('modal-title').textContent = 'Nouvel Utilisateur';
            document.getElementById('user-form').reset();
            document.getElementById('user-id').value = '';
            document.getElementById('password-field').style.display = 'block';
            document.getElementById('user-password').required = true;
            document.getElementById('submit-text').textContent = 'Créer';
            document.getElementById('user-modal').classList.add('active');
        }
        
        async function editUser(id) {
            try {
                const res = await axios.get(\`/api/auth/admin/users/\${id}\`);
                const user = res.data.user;
                
                document.getElementById('modal-title').textContent = 'Modifier Utilisateur';
                document.getElementById('user-id').value = user.id;
                document.getElementById('user-email').value = user.email;
                document.getElementById('user-fullname').value = user.full_name;
                document.getElementById('user-company').value = user.company || '';
                document.getElementById('user-role').value = user.role;
                document.getElementById('password-field').style.display = 'none';
                document.getElementById('user-password').required = false;
                document.getElementById('submit-text').textContent = 'Modifier';
                document.getElementById('user-modal').classList.add('active');
            } catch (err) {
                alert('Erreur chargement utilisateur');
            }
        }
        
        async function toggleUser(id, currentActive) {
            const action = currentActive ? 'désactiver' : 'réactiver';
            if (!confirm(\`Voulez-vous \${action} cet utilisateur ?\`)) return;
            
            try {
                if (currentActive) {
                    await axios.delete(\`/api/auth/admin/users/\${id}\`, {
                        headers: { Authorization: 'Bearer ' + sessionToken }
                    });
                } else {
                    await axios.put(\`/api/auth/admin/users/\${id}\`, 
                        { is_active: true },
                        { headers: { Authorization: 'Bearer ' + sessionToken } }
                    );
                }
                loadUsers();
                loadStats();
            } catch (err) {
                alert('Erreur modification statut');
            }
        }
        
        function closeModal() {
            document.getElementById('user-modal').classList.remove('active');
        }
        
        document.getElementById('user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userId = document.getElementById('user-id').value;
            const isEdit = !!userId;
            
            const data = {
                email: document.getElementById('user-email').value,
                full_name: document.getElementById('user-fullname').value,
                company: document.getElementById('user-company').value || null,
                role: document.getElementById('user-role').value,
            };
            
            if (!isEdit) {
                data.password = document.getElementById('user-password').value;
                data.must_change_password = document.getElementById('user-must-change').checked;
            }
            
            try {
                if (isEdit) {
                    await axios.put(\`/api/auth/admin/users/\${userId}\`, data, {
                        headers: { Authorization: 'Bearer ' + sessionToken }
                    });
                } else {
                    await axios.post('/api/auth/admin/users', data, {
                        headers: { Authorization: 'Bearer ' + sessionToken }
                    });
                }
                
                closeModal();
                loadUsers();
                loadStats();
                alert(isEdit ? 'Utilisateur modifié !' : 'Utilisateur créé !');
            } catch (err) {
                alert(err.response?.data?.message || 'Erreur');
            }
        });
    </script>
</body>
</html>
  `;
}
