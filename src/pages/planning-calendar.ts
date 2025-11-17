// Page Calendrier Planning - Vue mensuelle avec interventions
// Filtres par technicien et type d'intervention

export function getPlanningCalendarPage() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendrier Planning - DiagPV</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f8fafc; }
        .calendar-day {
            min-height: 120px;
            border: 1px solid #e5e7eb;
            cursor: pointer;
            transition: all 0.2s;
        }
        .calendar-day:hover {
            background: #f9fafb;
            border-color: #3b82f6;
        }
        .calendar-day.today {
            background: #eff6ff;
            border-color: #3b82f6;
            border-width: 2px;
        }
        .calendar-day.other-month {
            background: #fafafa;
            color: #9ca3af;
        }
        .intervention-badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            margin-bottom: 0.25rem;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .intervention-badge:hover {
            transform: scale(1.05);
        }
        .type-el_audit { background: #fef3c7; color: #92400e; }
        .type-iv_test { background: #dbeafe; color: #1e40af; }
        .type-thermography { background: #fee2e2; color: #991b1b; }
        .type-visual_inspection { background: #d1fae5; color: #065f46; }
        .type-commissioning { background: #e0e7ff; color: #3730a3; }
        .type-maintenance { background: #fce7f3; color: #831843; }
        .type-post_incident { background: #ffedd5; color: #9a3412; }
        .type-isolation_test { background: #ddd6fe; color: #5b21b6; }
        .legend-item {
            display: flex;
            align-items: center;
            padding: 0.5rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
        }
    </style>
</head>
<body class="min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a href="/planning" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-calendar-alt text-blue-600 mr-2"></i>
                        Calendrier Planning
                    </h1>
                </div>
                <div class="flex items-center space-x-3">
                    <button 
                        id="btnToday" 
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        Aujourd'hui
                    </button>
                    <button 
                        id="btnPrevMonth" 
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button 
                        id="btnNextMonth" 
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Titre Mois/Année -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div class="flex items-center justify-between">
                <h2 id="currentMonthYear" class="text-3xl font-bold text-gray-900"></h2>
                <div class="flex items-center space-x-4">
                    <!-- Filtres -->
                    <div class="flex items-center space-x-2">
                        <label class="text-sm font-semibold text-gray-700">Technicien:</label>
                        <select 
                            id="filterTechnician" 
                            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tous</option>
                        </select>
                    </div>
                    <div class="flex items-center space-x-2">
                        <label class="text-sm font-semibold text-gray-700">Type:</label>
                        <select 
                            id="filterType" 
                            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tous</option>
                            <option value="el_audit">Audit EL</option>
                            <option value="iv_test">Test I-V</option>
                            <option value="thermography">Thermographie</option>
                            <option value="visual_inspection">Contrôle Visuel</option>
                            <option value="commissioning">Commissioning</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="post_incident">Post-Sinistre</option>
                            <option value="isolation_test">Test Isolation</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Calendrier -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <!-- En-têtes jours -->
            <div class="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                <div class="text-center py-3 font-semibold text-gray-700 border-r border-gray-200">Lun</div>
                <div class="text-center py-3 font-semibold text-gray-700 border-r border-gray-200">Mar</div>
                <div class="text-center py-3 font-semibold text-gray-700 border-r border-gray-200">Mer</div>
                <div class="text-center py-3 font-semibold text-gray-700 border-r border-gray-200">Jeu</div>
                <div class="text-center py-3 font-semibold text-gray-700 border-r border-gray-200">Ven</div>
                <div class="text-center py-3 font-semibold text-gray-700 border-r border-gray-200">Sam</div>
                <div class="text-center py-3 font-semibold text-gray-700">Dim</div>
            </div>
            <!-- Grille calendrier -->
            <div id="calendarGrid" class="grid grid-cols-7">
                <!-- Contenu dynamique -->
            </div>
        </div>

        <!-- Légende -->
        <div class="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">
                <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                Légende Types d'Intervention
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="legend-item type-el_audit">
                    <i class="fas fa-lightbulb mr-2"></i>
                    Audit EL
                </div>
                <div class="legend-item type-iv_test">
                    <i class="fas fa-chart-line mr-2"></i>
                    Test I-V
                </div>
                <div class="legend-item type-thermography">
                    <i class="fas fa-thermometer-half mr-2"></i>
                    Thermographie
                </div>
                <div class="legend-item type-visual_inspection">
                    <i class="fas fa-eye mr-2"></i>
                    Contrôle Visuel
                </div>
                <div class="legend-item type-commissioning">
                    <i class="fas fa-check-circle mr-2"></i>
                    Commissioning
                </div>
                <div class="legend-item type-maintenance">
                    <i class="fas fa-wrench mr-2"></i>
                    Maintenance
                </div>
                <div class="legend-item type-post_incident">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Post-Sinistre
                </div>
                <div class="legend-item type-isolation_test">
                    <i class="fas fa-plug mr-2"></i>
                    Test Isolation
                </div>
            </div>
        </div>

    </main>

    <script>
        let currentDate = new Date();
        let allInterventions = [];
        let filteredInterventions = [];

        // Chargement initial
        async function init() {
            await loadTechnicians();
            await loadInterventions();
            renderCalendar();
        }

        // Charger techniciens pour filtre
        async function loadTechnicians() {
            try {
                const response = await fetch('/api/auth/users?role=subcontractor');
                const data = await response.json();
                
                if (data.success && data.users) {
                    const select = document.getElementById('filterTechnician');
                    data.users.forEach(user => {
                        const option = document.createElement('option');
                        option.value = user.id;
                        option.textContent = user.email;
                        select.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Erreur chargement techniciens:', error);
            }
        }

        // Charger interventions du mois
        async function loadInterventions() {
            try {
                const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                
                const dateFrom = firstDay.toISOString().split('T')[0];
                const dateTo = lastDay.toISOString().split('T')[0];

                const response = await fetch(\`/api/planning/interventions?date_from=\${dateFrom}&date_to=\${dateTo}\`);
                const data = await response.json();

                if (data.success) {
                    allInterventions = data.interventions || [];
                    applyFilters();
                }
            } catch (error) {
                console.error('Erreur chargement interventions:', error);
            }
        }

        // Appliquer filtres
        function applyFilters() {
            const technicianId = document.getElementById('filterTechnician').value;
            const type = document.getElementById('filterType').value;

            filteredInterventions = allInterventions.filter(intervention => {
                if (technicianId && intervention.technician_id != technicianId) {
                    return false;
                }
                if (type && intervention.intervention_type !== type) {
                    return false;
                }
                return true;
            });

            renderCalendar();
        }

        // Rendu calendrier
        function renderCalendar() {
            // Titre mois/année
            const monthYear = new Intl.DateTimeFormat('fr-FR', { 
                month: 'long', 
                year: 'numeric' 
            }).format(currentDate);
            document.getElementById('currentMonthYear').textContent = 
                monthYear.charAt(0).toUpperCase() + monthYear.slice(1);

            // Calcul jours du mois
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            
            // Jour de la semaine du 1er (0=Dimanche, 1=Lundi...)
            let firstDayOfWeek = firstDay.getDay();
            // Convertir au format Lundi=0, Dimanche=6
            firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

            // Grille calendrier
            const grid = document.getElementById('calendarGrid');
            grid.innerHTML = '';

            // Jours du mois précédent pour combler début
            const prevMonthLastDay = new Date(year, month, 0).getDate();
            for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                const day = prevMonthLastDay - i;
                const cell = createDayCell(day, true, new Date(year, month - 1, day));
                grid.appendChild(cell);
            }

            // Jours du mois actuel
            const today = new Date();
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const isToday = date.toDateString() === today.toDateString();
                const cell = createDayCell(day, false, date, isToday);
                grid.appendChild(cell);
            }

            // Jours du mois suivant pour combler fin
            const totalCells = grid.children.length;
            const remainingCells = 35 - totalCells; // 5 semaines minimum
            for (let day = 1; day <= remainingCells; day++) {
                const cell = createDayCell(day, true, new Date(year, month + 1, day));
                grid.appendChild(cell);
            }
        }

        // Créer cellule jour
        function createDayCell(day, isOtherMonth, date, isToday = false) {
            const cell = document.createElement('div');
            cell.className = 'calendar-day p-2';
            
            if (isOtherMonth) {
                cell.className += ' other-month';
            }
            if (isToday) {
                cell.className += ' today';
            }

            // Numéro du jour
            const dayNumber = document.createElement('div');
            dayNumber.className = 'text-sm font-semibold mb-2';
            if (isToday) {
                dayNumber.className += ' text-blue-600';
            }
            dayNumber.textContent = day;
            cell.appendChild(dayNumber);

            // Interventions du jour
            if (!isOtherMonth) {
                const dateStr = date.toISOString().split('T')[0];
                const dayInterventions = filteredInterventions.filter(i => 
                    i.intervention_date === dateStr
                );

                dayInterventions.forEach(intervention => {
                    const badge = document.createElement('div');
                    badge.className = \`intervention-badge type-\${intervention.intervention_type}\`;
                    badge.textContent = getInterventionTypeShort(intervention.intervention_type);
                    badge.title = \`\${intervention.project_name} - \${intervention.client_name}\`;
                    badge.onclick = (e) => {
                        e.stopPropagation();
                        window.location.href = \`/planning/detail?id=\${intervention.id}\`;
                    };
                    cell.appendChild(badge);
                });
            }

            // Clic sur jour = créer intervention
            cell.onclick = () => {
                if (!isOtherMonth) {
                    const dateStr = date.toISOString().split('T')[0];
                    window.location.href = \`/planning/create?date=\${dateStr}\`;
                }
            };

            return cell;
        }

        // Navigation mois
        function prevMonth() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            loadInterventions();
        }

        function nextMonth() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            loadInterventions();
        }

        function goToToday() {
            currentDate = new Date();
            loadInterventions();
        }

        // Event listeners
        document.getElementById('btnPrevMonth').addEventListener('click', prevMonth);
        document.getElementById('btnNextMonth').addEventListener('click', nextMonth);
        document.getElementById('btnToday').addEventListener('click', goToToday);
        document.getElementById('filterTechnician').addEventListener('change', applyFilters);
        document.getElementById('filterType').addEventListener('change', applyFilters);

        // Helper
        function getInterventionTypeShort(type) {
            const types = {
                'el_audit': 'EL',
                'iv_test': 'I-V',
                'thermography': 'Thermo',
                'visual_inspection': 'Visuel',
                'commissioning': 'Commiss.',
                'maintenance': 'Maint.',
                'post_incident': 'Sinistre',
                'isolation_test': 'Isolation'
            };
            return types[type] || type;
        }

        // Init
        init();
    </script>
</body>
</html>
  `;
}
