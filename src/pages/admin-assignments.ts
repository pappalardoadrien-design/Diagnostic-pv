export function getAdminAssignmentsPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Assignations Audits - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        body {
            background: #000;
            color: #fff;
            font-family: system-ui, -apple-system, sans-serif;
        }
        
        /* Buttons */
        .btn-orange {
            background: linear-gradient(135deg, #ff8c00, #ff6600);
            color: white;
            font-weight: bold;
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn-orange:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 140, 0, 0.4);
        }
        
        .btn-green {
            background: linear-gradient(135deg, #22c55e, #16a34a);
        }
        .btn-green:hover {
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        }
        
        .btn-red {
            background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        .btn-red:hover {
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
        
        .btn-gray {
            background: linear-gradient(135deg, #6b7280, #4b5563);
        }
        
        /* Cards */
        .card {
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
            border: 1px solid #333;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        
        .stat-card {
            background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
            border-left: 4px solid;
            padding: 20px;
            border-radius: 8px;
        }
        
        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
            background: #1a1a1a;
            border-radius: 8px;
            overflow: hidden;
        }
        
        thead {
            background: linear-gradient(135deg, #ff8c00, #ff6600);
        }
        
        th {
            padding: 16px;
            text-align: left;
            font-weight: bold;
            color: white;
        }
        
        td {
            padding: 16px;
            border-bottom: 1px solid #333;
        }
        
        tbody tr:hover {
            background: #2a2a2a;
        }
        
        /* Badges */
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .badge-active { background: #22c55e; color: #000; }
        .badge-revoked { background: #ef4444; color: #fff; }
        .badge-expired { background: #6b7280; color: #fff; }
        
        .permission-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.7rem;
            margin: 2px;
        }
        .permission-view { background: #3b82f6; color: #fff; }
        .permission-edit { background: #f59e0b; color: #fff; }
        .permission-delete { background: #ef4444; color: #fff; }
        
        /* Modal */
        .modal {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: #1a1a1a;
            border: 2px solid #ff8c00;
            border-radius: 16px;
            padding: 32px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        /* Forms */
        input, select, textarea {
            width: 100%;
            background: #000;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 12px;
            color: #fff;
            font-size: 1rem;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #ff8c00;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #ff8c00;
        }
        
        .checkbox-group {
            display: flex;
            gap: 16px;
            align-items: center;
        }
        
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .checkbox-item input[type="checkbox"] {
            width: 20px;
            height: 20px;
            margin: 0;
        }
        
        /* Loading */
        .loading {
            text-align: center;
            padding: 40px;
            color: #ff8c00;
        }
        
        .spinner {
            border: 4px solid #333;
            border-top: 4px solid #ff8c00;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            table {
                font-size: 0.875rem;
            }
            
            th, td {
                padding: 12px 8px;
            }
            
            .stat-card {
                padding: 16px;
            }
        }
    </style>
</head>
<body class="p-6">
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-4xl font-black mb-2">
                    <i class="fas fa-users-cog text-orange-500 mr-3"></i>
                    ASSIGNATIONS AUDITS
                </h1>
                <p class="text-gray-400">Gestion des accès sous-traitants aux audits EL</p>
            </div>
            <div class="flex gap-4">
                <a href="/" class="btn-gray">
                    <i class="fas fa-home mr-2"></i>Accueil
                </a>
                <a href="/admin/users" class="btn-gray">
                    <i class="fas fa-users mr-2"></i>Utilisateurs
                </a>
                <button onclick="showCreateModal()" class="btn-orange">
                    <i class="fas fa-plus mr-2"></i>Nouvelle Assignation
                </button>
            </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" id="statsContainer">
            <div class="stat-card" style="border-left-color: #22c55e;">
                <div class="text-gray-400 text-sm mb-2">Total Assignations</div>
                <div class="text-3xl font-black" id="statTotal">-</div>
            </div>
            <div class="stat-card" style="border-left-color: #3b82f6;">
                <div class="text-gray-400 text-sm mb-2">Actives</div>
                <div class="text-3xl font-black" id="statActive">-</div>
            </div>
            <div class="stat-card" style="border-left-color: #ef4444;">
                <div class="text-gray-400 text-sm mb-2">Révoquées</div>
                <div class="text-3xl font-black" id="statRevoked">-</div>
            </div>
            <div class="stat-card" style="border-left-color: #f59e0b;">
                <div class="text-gray-400 text-sm mb-2">Sous-traitants Assignés</div>
                <div class="text-3xl font-black" id="statUsers">-</div>
            </div>
        </div>

        <!-- Filters -->
        <div class="card mb-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label for="filterSearch">Recherche</label>
                    <input type="text" id="filterSearch" placeholder="Nom, email, projet...">
                </div>
                <div>
                    <label for="filterUser">Utilisateur</label>
                    <select id="filterUser">
                        <option value="">Tous</option>
                    </select>
                </div>
                <div>
                    <label for="filterAudit">Audit</label>
                    <select id="filterAudit">
                        <option value="">Tous</option>
                    </select>
                </div>
                <div>
                    <label for="filterStatus">Statut</label>
                    <select id="filterStatus">
                        <option value="">Tous</option>
                        <option value="active">Active</option>
                        <option value="revoked">Révoquée</option>
                        <option value="expired">Expirée</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="card">
            <div id="loadingContainer" class="loading">
                <div class="spinner"></div>
                <p class="mt-4">Chargement des assignations...</p>
            </div>

            <div id="tableContainer" style="display: none;">
                <table>
                    <thead>
                        <tr>
                            <th>Sous-traitant</th>
                            <th>Audit</th>
                            <th>Permissions</th>
                            <th>Statut</th>
                            <th>Assigné le</th>
                            <th>Expire le</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="assignmentsTableBody">
                        <!-- Dynamic content -->
                    </tbody>
                </table>
                
                <div id="emptyState" style="display: none;" class="text-center py-12">
                    <i class="fas fa-inbox text-6xl text-gray-600 mb-4"></i>
                    <p class="text-xl text-gray-400">Aucune assignation trouvée</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Create/Edit -->
    <div id="assignmentModal" class="modal">
        <div class="modal-content">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-black text-orange-500" id="modalTitle">
                    <i class="fas fa-plus-circle mr-2"></i>
                    Nouvelle Assignation
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white text-2xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="assignmentForm" class="space-y-6">
                <input type="hidden" id="assignmentId">

                <div>
                    <label for="userId">Sous-traitant *</label>
                    <select id="userId" required>
                        <option value="">Sélectionner un utilisateur...</option>
                    </select>
                </div>

                <div>
                    <label for="auditToken">Audit EL *</label>
                    <select id="auditToken" required>
                        <option value="">Sélectionner un audit...</option>
                    </select>
                </div>

                <div>
                    <label>Permissions *</label>
                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="canView" checked>
                            <label for="canView" style="margin: 0; color: #fff;">👁️ Lecture</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="canEdit">
                            <label for="canEdit" style="margin: 0; color: #fff;">✏️ Édition</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="canDelete">
                            <label for="canDelete" style="margin: 0; color: #fff;">🗑️ Suppression</label>
                        </div>
                    </div>
                </div>

                <div>
                    <label for="expiresAt">Date d'expiration (optionnel)</label>
                    <input type="datetime-local" id="expiresAt">
                    <p class="text-sm text-gray-400 mt-2">Laisser vide pour un accès permanent</p>
                </div>

                <div>
                    <label for="notes">Notes (optionnel)</label>
                    <textarea id="notes" rows="3" placeholder="Informations complémentaires..."></textarea>
                </div>

                <div class="flex gap-4">
                    <button type="submit" class="btn-orange flex-1">
                        <i class="fas fa-save mr-2"></i>
                        <span id="submitBtnText">Créer l'assignation</span>
                    </button>
                    <button type="button" onclick="closeModal()" class="btn-gray flex-1">
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Global state
        let assignments = [];
        let users = [];
        let audits = [];
        let isEditMode = false;

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadStats();
            loadAssignments();
            loadUsers();
            loadAudits();

            // Filter listeners
            document.getElementById('filterSearch').addEventListener('input', debounce(loadAssignments, 500));
            document.getElementById('filterUser').addEventListener('change', loadAssignments);
            document.getElementById('filterAudit').addEventListener('change', loadAssignments);
            document.getElementById('filterStatus').addEventListener('change', loadAssignments);

            // Form submit
            document.getElementById('assignmentForm').addEventListener('submit', handleSubmit);
        });

        // Load statistics
        async function loadStats() {
            try {
                const response = await axios.get('/api/auth/admin/assignments');
                const data = response.data;

                if (data.success) {
                    const total = data.assignments.length;
                    const active = data.assignments.filter(a => a.status === 'active').length;
                    const revoked = data.assignments.filter(a => a.status === 'revoked').length;
                    const uniqueUsers = new Set(data.assignments.map(a => a.user_id)).size;

                    document.getElementById('statTotal').textContent = total;
                    document.getElementById('statActive').textContent = active;
                    document.getElementById('statRevoked').textContent = revoked;
                    document.getElementById('statUsers').textContent = uniqueUsers;
                }
            } catch (error) {
                console.error('Erreur chargement stats:', error);
            }
        }

        // Load assignments
        async function loadAssignments() {
            try {
                document.getElementById('loadingContainer').style.display = 'block';
                document.getElementById('tableContainer').style.display = 'none';

                const params = new URLSearchParams();
                const search = document.getElementById('filterSearch').value;
                const userId = document.getElementById('filterUser').value;
                const auditToken = document.getElementById('filterAudit').value;
                const status = document.getElementById('filterStatus').value;

                if (search) params.append('search', search);
                if (userId) params.append('user_id', userId);
                if (auditToken) params.append('audit_token', auditToken);
                if (status) params.append('status', status);

                const response = await axios.get(\`/api/auth/admin/assignments?\${params.toString()}\`);
                const data = response.data;

                if (data.success) {
                    assignments = data.assignments;
                    renderAssignments();
                    loadStats(); // Refresh stats
                }

                document.getElementById('loadingContainer').style.display = 'none';
                document.getElementById('tableContainer').style.display = 'block';

            } catch (error) {
                console.error('Erreur chargement assignations:', error);
                document.getElementById('loadingContainer').innerHTML = 
                    '<p class="text-red-500">Erreur de chargement. Veuillez réessayer.</p>';
            }
        }

        // Render assignments table
        function renderAssignments() {
            const tbody = document.getElementById('assignmentsTableBody');
            const emptyState = document.getElementById('emptyState');

            if (assignments.length === 0) {
                tbody.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';

            tbody.innerHTML = assignments.map(assignment => {
                const permissions = [];
                if (assignment.can_view) permissions.push('<span class="permission-badge permission-view">👁️ Lecture</span>');
                if (assignment.can_edit) permissions.push('<span class="permission-badge permission-edit">✏️ Édition</span>');
                if (assignment.can_delete) permissions.push('<span class="permission-badge permission-delete">🗑️ Suppression</span>');

                const statusBadge = {
                    'active': '<span class="badge badge-active">Active</span>',
                    'revoked': '<span class="badge badge-revoked">Révoquée</span>',
                    'expired': '<span class="badge badge-expired">Expirée</span>'
                }[assignment.status] || '<span class="badge">Inconnu</span>';

                const assignedDate = new Date(assignment.assigned_at).toLocaleDateString('fr-FR');
                const expiresDate = assignment.expires_at 
                    ? new Date(assignment.expires_at).toLocaleDateString('fr-FR')
                    : '<span class="text-gray-500">Permanent</span>';

                return \`
                    <tr>
                        <td>
                            <div class="font-bold">\${assignment.full_name || 'N/A'}</div>
                            <div class="text-sm text-gray-400">\${assignment.email || ''}</div>
                            <div class="text-xs text-gray-500">\${assignment.company || ''}</div>
                        </td>
                        <td>
                            <div class="font-bold">\${assignment.project_name || 'Audit inconnu'}</div>
                            <div class="text-sm text-gray-400">\${assignment.client_name || ''}</div>
                            <div class="text-xs text-gray-500">\${assignment.location || ''}</div>
                        </td>
                        <td>\${permissions.join(' ')}</td>
                        <td>\${statusBadge}</td>
                        <td>\${assignedDate}</td>
                        <td>\${expiresDate}</td>
                        <td>
                            <div class="flex gap-2">
                                <button onclick="editAssignment(\${assignment.id})" class="btn-orange py-1 px-3 text-sm" title="Modifier">
                                    <i class="fas fa-edit"></i>
                                </button>
                                \${assignment.status === 'active' ? \`
                                    <button onclick="revokeAssignment(\${assignment.id})" class="btn-red py-1 px-3 text-sm" title="Révoquer">
                                        <i class="fas fa-ban"></i>
                                    </button>
                                \` : ''}
                            </div>
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        // Load users for select
        async function loadUsers() {
            try {
                const response = await axios.get('/api/auth/admin/users?role=subcontractor&status=active');
                const data = response.data;

                if (data.success) {
                    users = data.users;
                    const select = document.getElementById('userId');
                    const filterSelect = document.getElementById('filterUser');

                    select.innerHTML = '<option value="">Sélectionner un utilisateur...</option>' +
                        users.map(u => \`<option value="\${u.id}">\${u.full_name} (\${u.email})</option>\`).join('');

                    filterSelect.innerHTML = '<option value="">Tous</option>' +
                        users.map(u => \`<option value="\${u.id}">\${u.full_name}</option>\`).join('');
                }
            } catch (error) {
                console.error('Erreur chargement utilisateurs:', error);
            }
        }

        // Load audits for select
        async function loadAudits() {
            try {
                const response = await axios.get('/api/el/dashboard/audits');
                const data = response.data;

                if (data.success) {
                    audits = data.audits;
                    const select = document.getElementById('auditToken');
                    const filterSelect = document.getElementById('filterAudit');

                    select.innerHTML = '<option value="">Sélectionner un audit...</option>' +
                        audits.map(a => \`<option value="\${a.token}">\${a.project_name} - \${a.client_name}</option>\`).join('');

                    filterSelect.innerHTML = '<option value="">Tous</option>' +
                        audits.map(a => \`<option value="\${a.token}">\${a.project_name}</option>\`).join('');
                }
            } catch (error) {
                console.error('Erreur chargement audits:', error);
            }
        }

        // Show create modal
        function showCreateModal() {
            isEditMode = false;
            document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus-circle mr-2"></i>Nouvelle Assignation';
            document.getElementById('submitBtnText').textContent = 'Créer l\'assignation';
            document.getElementById('assignmentForm').reset();
            document.getElementById('assignmentId').value = '';
            document.getElementById('canView').checked = true;
            document.getElementById('assignmentModal').classList.add('active');
        }

        // Edit assignment
        async function editAssignment(id) {
            try {
                const response = await axios.get(\`/api/auth/admin/assignments/\${id}\`);
                const data = response.data;

                if (data.success) {
                    isEditMode = true;
                    const assignment = data.assignment;

                    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit mr-2"></i>Modifier Assignation';
                    document.getElementById('submitBtnText').textContent = 'Enregistrer';
                    document.getElementById('assignmentId').value = assignment.id;
                    document.getElementById('userId').value = assignment.user_id;
                    document.getElementById('auditToken').value = assignment.audit_token;
                    document.getElementById('canView').checked = assignment.can_view;
                    document.getElementById('canEdit').checked = assignment.can_edit;
                    document.getElementById('canDelete').checked = assignment.can_delete;
                    document.getElementById('expiresAt').value = assignment.expires_at 
                        ? assignment.expires_at.replace(' ', 'T').substring(0, 16)
                        : '';
                    document.getElementById('notes').value = assignment.notes || '';

                    document.getElementById('assignmentModal').classList.add('active');
                }
            } catch (error) {
                console.error('Erreur chargement assignation:', error);
                alert('Erreur lors du chargement de l\'assignation');
            }
        }

        // Revoke assignment
        async function revokeAssignment(id) {
            if (!confirm('Êtes-vous sûr de vouloir révoquer cette assignation ?')) return;

            try {
                const response = await axios.delete(\`/api/auth/admin/assignments/\${id}\`);
                const data = response.data;

                if (data.success) {
                    alert('Assignation révoquée avec succès');
                    loadAssignments();
                } else {
                    alert('Erreur: ' + data.error);
                }
            } catch (error) {
                console.error('Erreur révocation:', error);
                alert('Erreur lors de la révocation');
            }
        }

        // Handle form submit
        async function handleSubmit(e) {
            e.preventDefault();

            const assignmentId = document.getElementById('assignmentId').value;
            const userId = document.getElementById('userId').value;
            const auditToken = document.getElementById('auditToken').value;
            const canView = document.getElementById('canView').checked;
            const canEdit = document.getElementById('canEdit').checked;
            const canDelete = document.getElementById('canDelete').checked;
            const expiresAt = document.getElementById('expiresAt').value || null;
            const notes = document.getElementById('notes').value || null;

            const payload = {
                user_id: parseInt(userId),
                audit_token: auditToken,
                can_view: canView,
                can_edit: canEdit,
                can_delete: canDelete,
                assigned_by: 1, // TODO: Get from session
                expires_at: expiresAt ? expiresAt.replace('T', ' ') + ':00' : null,
                notes: notes
            };

            try {
                let response;
                if (isEditMode) {
                    response = await axios.put(\`/api/auth/admin/assignments/\${assignmentId}\`, {
                        can_view: canView,
                        can_edit: canEdit,
                        can_delete: canDelete,
                        expires_at: payload.expires_at,
                        notes: notes,
                        status: 'active'
                    });
                } else {
                    response = await axios.post('/api/auth/admin/assignments', payload);
                }

                const data = response.data;

                if (data.success) {
                    alert(isEditMode ? 'Assignation modifiée avec succès' : 'Assignation créée avec succès');
                    closeModal();
                    loadAssignments();
                } else {
                    alert('Erreur: ' + data.error);
                }
            } catch (error) {
                console.error('Erreur soumission:', error);
                alert('Erreur lors de la soumission: ' + (error.response?.data?.error || error.message));
            }
        }

        // Close modal
        function closeModal() {
            document.getElementById('assignmentModal').classList.remove('active');
            document.getElementById('assignmentForm').reset();
        }

        // Debounce utility
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    </script>
</body>
</html>
  `;
}
