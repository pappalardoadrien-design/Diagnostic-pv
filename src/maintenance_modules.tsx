// Templates pour modules en maintenance
const maintenanceModuleTemplate = (moduleName, icon, color, features) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module ${moduleName} - En Développement</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen flex items-center justify-center">
        <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <div class="w-16 h-16 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-${icon} text-2xl text-${color}-600"></i>
            </div>
            
            <h1 class="text-2xl font-bold text-gray-800 mb-2">Module ${moduleName}</h1>
            <p class="text-gray-600 mb-6">Ce module est actuellement en développement pour intégrer les équipements professionnels terrain.</p>
            
            <div class="bg-blue-50 rounded-lg p-4 mb-6 text-sm text-blue-800">
                <p class="font-semibold mb-1">🛠️ En cours de développement :</p>
                <ul class="text-left space-y-1">
                    ${features.map(f => `<li>• ${f}</li>`).join('')}
                </ul>
            </div>
            
            <div class="flex space-x-3 mb-6">
                <a href="/modules/electroluminescence" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium">
                    <i class="fas fa-moon mr-2"></i>Module EL
                </a>
                <a href="/" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium">
                    <i class="fas fa-home mr-2"></i>Hub
                </a>
            </div>
            
            <!-- Section Actions globales -->
            <div class="pt-6 border-t border-gray-200">
                <h3 class="text-lg font-bold text-gray-800 mb-4">Actions globales</h3>
                
                <div class="grid grid-cols-2 gap-3">
                    <button onclick="createNewProject()" class="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm">
                        <i class="fas fa-plus mr-2"></i>Nouveau Projet
                    </button>
                    
                    <button onclick="viewAllProjects()" class="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm">
                        <i class="fas fa-folder mr-2"></i>Tous les Projets
                    </button>
                </div>
            </div>
        </div>

        <script>
        function createNewProject() {
            window.location.href = '/projects/new';
        }

        function viewAllProjects() {
            window.location.href = '/projects';
        }
        </script>
    </body>
    </html>
`;

export const thermographyMaintenance = maintenanceModuleTemplate(
    'Thermographie',
    'thermometer-half',
    'orange',
    [
        'Interface caméras thermiques FLIR/Testo',
        'Analyse temps réel DIN EN 62446-3',
        'Détection automatique points chauds',
        'Rapports conformes normes'
    ]
);

export const ivCurvesMaintenance = maintenanceModuleTemplate(
    'Courbes I-V',
    'chart-line',
    'blue',
    [
        'Interface multimètres/traceurs I-V',
        'Calculs paramétriques IEC 60904-1',
        'Comparaison courbes constructeur',
        'Analyse performances strings'
    ]
);

export const isolationMaintenance = maintenanceModuleTemplate(
    'Tests Isolement',
    'plug',
    'yellow',
    [
        'Interface testeurs Megger/Fluke',
        'Conformité NFC 15-100 automatique',
        'Tests DC/AC avec seuils normatifs',
        'Certificats conformité'
    ]
);

export const visualMaintenance = maintenanceModuleTemplate(
    'Contrôles Visuels',
    'eye',
    'green',
    [
        'Checklists IEC 62446-1',
        'Capture photos GPS géolocalisées',
        'Classification criticité automatique',
        'Plans d\\'actions terrain'
    ]
);

export const expertiseMaintenance = maintenanceModuleTemplate(
    'Expertise Post-Sinistre',
    'gavel',
    'red',
    [
        'Évaluation dommages assurance',
        'Calculs pertes énergétiques/financières',
        'Rapports contradictoires judiciaires',
        'Interface compagnies assurance'
    ]
);