<?php
/**
 * Exemple d'intégration DiagPV Audit via API REST
 * Compatible avec votre hub diagnostic existant
 */

class DiagPVIntegration {
    
    private $apiBase = 'https://9b8a231d.diagpv-audit.pages.dev/api';
    
    /**
     * Récupérer tous les audits
     */
    public function getAudits() {
        $response = $this->makeRequest('/dashboard/audits');
        return $response['audits'] ?? [];
    }
    
    /**
     * Créer un nouvel audit depuis votre hub
     */
    public function createAudit($projectName, $clientName, $location, $configuration) {
        $data = [
            'projectName' => $projectName,
            'clientName' => $clientName,
            'location' => $location,
            'configuration' => $configuration
        ];
        
        return $this->makeRequest('/audit/create', 'POST', $data);
    }
    
    /**
     * Récupérer un audit spécifique avec modules
     */
    public function getAudit($token) {
        return $this->makeRequest("/audit/{$token}");
    }
    
    /**
     * Générer le rapport PDF
     */
    public function getReport($token) {
        $url = $this->apiBase . "/audit/{$token}/report";
        return $url; // Retourne l'URL pour téléchargement direct
    }
    
    /**
     * Mettre à jour modules en lot
     */
    public function updateModules($token, $modules, $status, $comment = null) {
        $data = [
            'modules' => $modules,
            'status' => $status,
            'comment' => $comment
        ];
        
        return $this->makeRequest("/audit/{$token}/bulk-update", 'POST', $data);
    }
    
    /**
     * Requête HTTP vers l'API DiagPV
     */
    private function makeRequest($endpoint, $method = 'GET', $data = null) {
        $url = $this->apiBase . $endpoint;
        
        $options = [
            'http' => [
                'method' => $method,
                'header' => [
                    'Content-Type: application/json',
                    'User-Agent: DiagPV-Hub/1.0'
                ]
            ]
        ];
        
        if ($data && $method === 'POST') {
            $options['http']['content'] = json_encode($data);
        }
        
        $context = stream_context_create($options);
        $response = file_get_contents($url, false, $context);
        
        if ($response === false) {
            throw new Exception("Erreur API DiagPV: {$url}");
        }
        
        return json_decode($response, true);
    }
}

/**
 * Exemple d'utilisation dans votre hub
 */

// Initialisation
$diagpv = new DiagPVIntegration();

try {
    // Récupérer la liste des audits
    $audits = $diagpv->getAudits();
    
    // Créer un nouvel audit depuis votre formulaire
    if ($_POST['action'] === 'create_audit') {
        $result = $diagpv->createAudit(
            $_POST['project_name'],
            $_POST['client_name'], 
            $_POST['location'],
            [
                'mode' => 'simple',
                'stringCount' => (int)$_POST['string_count'],
                'modulesPerString' => (int)$_POST['modules_per_string']
            ]
        );
        
        if ($result['success']) {
            // Rediriger vers l'audit
            $auditUrl = "https://9b8a231d.diagpv-audit.pages.dev/audit/{$result['auditToken']}";
            header("Location: {$auditUrl}");
            exit;
        }
    }
    
    // Afficher les audits dans votre hub
    foreach ($audits as $audit) {
        echo "<div class='audit-item'>";
        echo "<h3>{$audit['project_name']}</h3>";
        echo "<p>Client: {$audit['client_name']}</p>";
        echo "<p>Progression: {$audit['progression_pct']}%</p>";
        echo "<a href='https://9b8a231d.diagpv-audit.pages.dev/audit/{$audit['token']}' target='_blank'>";
        echo "Ouvrir Audit EL</a>";
        echo "<a href='{$diagpv->getReport($audit['token'])}' target='_blank'>";
        echo "Télécharger Rapport</a>";
        echo "</div>";
    }
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}

?>

<!-- Formulaire de création d'audit intégré -->
<form method="POST" class="diagpv-create-form">
    <input type="hidden" name="action" value="create_audit">
    
    <div class="form-group">
        <label>Nom du projet</label>
        <input type="text" name="project_name" required>
    </div>
    
    <div class="form-group">
        <label>Client</label>
        <input type="text" name="client_name" required>
    </div>
    
    <div class="form-group">
        <label>Localisation</label>
        <input type="text" name="location" required>
    </div>
    
    <div class="form-group">
        <label>Nombre de strings</label>
        <input type="number" name="string_count" min="1" max="20" required>
    </div>
    
    <div class="form-group">
        <label>Modules par string</label>
        <input type="number" name="modules_per_string" min="1" max="50" required>
    </div>
    
    <button type="submit" class="btn-diagpv">
        🌙 Créer Audit EL
    </button>
</form>

<style>
.diagpv-create-form {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    padding: 20px;
    border-radius: 12px;
    color: white;
    margin: 20px 0;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #fbbf24;
}

.form-group input {
    width: 100%;
    padding: 10px;
    border: 2px solid #6b7280;
    border-radius: 6px;
    background: #000;
    color: white;
    font-size: 14px;
}

.form-group input:focus {
    border-color: #fbbf24;
    outline: none;
}

.btn-diagpv {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: black;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    font-size: 16px;
}

.btn-diagpv:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
}

.audit-item {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 15px;
    margin: 10px 0;
}

.audit-item a {
    display: inline-block;
    margin-right: 10px;
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-size: 14px;
}

.audit-item a:hover {
    background: #2563eb;
}
</style>