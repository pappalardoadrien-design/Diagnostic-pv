<?php
/**
 * Plugin Name: DiagPV Audit Integration
 * Description: Intégration DiagPV Audit EL dans WordPress
 * Version: 1.0.0
 * Author: DiagPV
 */

// Sécurité WordPress
if (!defined('ABSPATH')) {
    exit;
}

class DiagPVWordPressIntegration {
    
    private $api_base = 'https://9b8a231d.diagpv-audit.pages.dev/api';
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('diagpv_audits', array($this, 'shortcode_audits'));
        add_shortcode('diagpv_create', array($this, 'shortcode_create_form'));
        add_action('wp_ajax_diagpv_create_audit', array($this, 'ajax_create_audit'));
        add_action('wp_ajax_nopriv_diagpv_create_audit', array($this, 'ajax_create_audit'));
    }
    
    public function init() {
        // Initialisation du plugin
    }
    
    public function enqueue_scripts() {
        wp_enqueue_script('diagpv-integration', plugins_url('diagpv-integration.js', __FILE__), array('jquery'), '1.0.0', true);
        wp_enqueue_style('diagpv-integration', plugins_url('diagpv-integration.css', __FILE__), array(), '1.0.0');
        
        wp_localize_script('diagpv-integration', 'diagpv_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('diagpv_nonce')
        ));
    }
    
    /**
     * Shortcode pour afficher la liste des audits
     * Usage: [diagpv_audits]
     */
    public function shortcode_audits($atts) {
        $atts = shortcode_atts(array(
            'limit' => 10
        ), $atts);
        
        $audits = $this->get_audits();
        
        ob_start();
        ?>
        <div class="diagpv-audits-container">
            <h3>🌙 Audits Électroluminescence</h3>
            
            <?php if (empty($audits)): ?>
                <p>Aucun audit disponible pour le moment.</p>
            <?php else: ?>
                <div class="diagpv-audits-grid">
                    <?php foreach (array_slice($audits, 0, $atts['limit']) as $audit): ?>
                        <div class="diagpv-audit-card">
                            <div class="audit-header">
                                <h4><?php echo esc_html($audit['project_name']); ?></h4>
                                <span class="status-badge" data-progress="<?php echo $audit['progression_pct']; ?>">
                                    <?php echo $audit['progression_pct']; ?>%
                                </span>
                            </div>
                            
                            <div class="audit-info">
                                <p><strong>Client:</strong> <?php echo esc_html($audit['client_name']); ?></p>
                                <p><strong>Modules:</strong> <?php echo $audit['total_modules']; ?></p>
                                <p><strong>Défauts:</strong> <?php echo $audit['defauts_total']; ?></p>
                                <p><strong>Créé:</strong> <?php echo $audit['created_at_formatted']; ?></p>
                            </div>
                            
                            <div class="audit-actions">
                                <a href="https://9b8a231d.diagpv-audit.pages.dev/audit/<?php echo $audit['token']; ?>" 
                                   target="_blank" class="btn-diagpv btn-open">
                                    🌙 Ouvrir Audit
                                </a>
                                <a href="https://9b8a231d.diagpv-audit.pages.dev/api/audit/<?php echo $audit['token']; ?>/report" 
                                   target="_blank" class="btn-diagpv btn-report">
                                    📄 Rapport PDF
                                </a>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Shortcode pour formulaire de création d'audit  
     * Usage: [diagpv_create]
     */
    public function shortcode_create_form($atts) {
        ob_start();
        ?>
        <div class="diagpv-create-container">
            <h3>Créer un Audit Électroluminescence</h3>
            
            <form id="diagpv-create-form" class="diagpv-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="project_name">Nom du projet *</label>
                        <input type="text" id="project_name" name="project_name" required 
                               placeholder="Ex: Installation Résidentielle">
                    </div>
                    
                    <div class="form-group">
                        <label for="client_name">Client *</label>
                        <input type="text" id="client_name" name="client_name" required 
                               placeholder="Ex: M. Dupont">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="location">Localisation *</label>
                    <input type="text" id="location" name="location" required 
                           placeholder="Ex: 123 Rue de la Paix, 75001 Paris">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="string_count">Nombre de strings *</label>
                        <input type="number" id="string_count" name="string_count" 
                               min="1" max="20" value="4" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="modules_per_string">Modules par string *</label>
                        <input type="number" id="modules_per_string" name="modules_per_string" 
                               min="1" max="50" value="6" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <button type="submit" class="btn-diagpv btn-create">
                        🌙 Créer Audit EL
                    </button>
                </div>
                
                <div id="diagpv-message" class="diagpv-message" style="display: none;"></div>
            </form>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Handler AJAX pour création d'audit
     */
    public function ajax_create_audit() {
        // Vérification nonce de sécurité
        if (!wp_verify_nonce($_POST['nonce'], 'diagpv_nonce')) {
            wp_die('Erreur de sécurité');
        }
        
        $data = array(
            'projectName' => sanitize_text_field($_POST['project_name']),
            'clientName' => sanitize_text_field($_POST['client_name']),
            'location' => sanitize_text_field($_POST['location']),
            'configuration' => array(
                'mode' => 'simple',
                'stringCount' => intval($_POST['string_count']),
                'modulesPerString' => intval($_POST['modules_per_string'])
            )
        );
        
        $result = $this->create_audit($data);
        
        if ($result && $result['success']) {
            wp_send_json_success(array(
                'message' => 'Audit créé avec succès !',
                'audit_url' => 'https://9b8a231d.diagpv-audit.pages.dev/audit/' . $result['auditToken']
            ));
        } else {
            wp_send_json_error('Erreur lors de la création de l\'audit');
        }
    }
    
    /**
     * Récupérer les audits via API
     */
    private function get_audits() {
        $response = wp_remote_get($this->api_base . '/dashboard/audits');
        
        if (is_wp_error($response)) {
            return array();
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        return $data['audits'] ?? array();
    }
    
    /**
     * Créer un audit via API
     */
    private function create_audit($data) {
        $response = wp_remote_post($this->api_base . '/audit/create', array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode($data),
            'timeout' => 30
        ));
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        return json_decode($body, true);
    }
}

// Initialisation du plugin
new DiagPVWordPressIntegration();

/**
 * JavaScript pour le plugin (à sauver dans diagpv-integration.js)
 */
?>

<script>
jQuery(document).ready(function($) {
    $('#diagpv-create-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        formData.append('action', 'diagpv_create_audit');
        formData.append('nonce', diagpv_ajax.nonce);
        
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.text();
        
        submitBtn.text('🔄 Création en cours...').prop('disabled', true);
        
        $.ajax({
            url: diagpv_ajax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    $('#diagpv-message')
                        .removeClass('error')
                        .addClass('success')
                        .text(response.data.message)
                        .show();
                    
                    // Ouvrir l'audit dans un nouvel onglet
                    setTimeout(function() {
                        window.open(response.data.audit_url, '_blank');
                    }, 1000);
                    
                    // Reset form
                    $('#diagpv-create-form')[0].reset();
                } else {
                    $('#diagpv-message')
                        .removeClass('success')
                        .addClass('error')
                        .text(response.data || 'Erreur lors de la création')
                        .show();
                }
            },
            error: function() {
                $('#diagpv-message')
                    .removeClass('success')
                    .addClass('error')
                    .text('Erreur de connexion')
                    .show();
            },
            complete: function() {
                submitBtn.text(originalText).prop('disabled', false);
            }
        });
    });
});
</script>

<style>
/* CSS pour le plugin (à sauver dans diagpv-integration.css) */
.diagpv-audits-container,
.diagpv-create-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    margin: 20px 0;
}

.diagpv-audits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.diagpv-audit-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.diagpv-form {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    padding: 25px;
    border-radius: 12px;
    color: white;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
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
    padding: 10px 12px;
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
    display: inline-block;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    text-decoration: none;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
}

.btn-create {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: black;
    font-size: 16px;
    width: 100%;
}

.btn-open {
    background: #3b82f6;
    color: white;
    margin-right: 10px;
}

.btn-report {
    background: #6b7280;
    color: white;
}

.diagpv-message {
    margin-top: 15px;
    padding: 10px;
    border-radius: 6px;
    font-weight: bold;
}

.diagpv-message.success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #10b981;
}

.diagpv-message.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #ef4444;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    color: white;
}

.status-badge[data-progress="100"] { background: #10b981; }
.status-badge[data-progress*="5"], .status-badge[data-progress*="6"], 
.status-badge[data-progress*="7"], .status-badge[data-progress*="8"], 
.status-badge[data-progress*="9"] { background: #f59e0b; }

@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .diagpv-audits-grid {
        grid-template-columns: 1fr;
    }
}
</style>
<?php