import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const missionOrdersRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// GET /api/mission-orders/:intervention_id/generate - Générer PDF Ordre de Mission
// ============================================================================
missionOrdersRoutes.get('/:intervention_id/generate', async (c) => {
  try {
    const { DB } = c.env;
    const interventionId = parseInt(c.req.param('intervention_id'));

    // Récupérer données intervention complètes
    const intervention = await DB.prepare(`
      SELECT 
        i.*,
        p.name as project_name,
        p.site_address as site_address,
        p.technical_notes as technical_notes,
        cl.company_name as client_name,
        cl.main_contact_name as client_contact,
        cl.main_contact_email as client_email,
        cl.main_contact_phone as client_phone,
        cl.address as client_address,
        u.email as technician_email,
        u.full_name as technician_name
      FROM interventions i
      LEFT JOIN projects p ON p.id = i.project_id
      LEFT JOIN crm_clients cl ON cl.id = p.client_id
      LEFT JOIN auth_users u ON u.id = i.technician_id
      WHERE i.id = ?
    `).bind(interventionId).first();

    if (!intervention) {
      return c.json({ error: 'Intervention non trouvée' }, 404);
    }

    // Générer HTML pour PDF
    const html = generateMissionOrderHTML(intervention);

    return c.html(html);
  } catch (error: any) {
    console.error('Erreur génération ordre de mission:', error);
    return c.json({ 
      error: 'Erreur lors de la génération de l\'ordre de mission',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// POST /api/mission-orders/:intervention_id/send - Envoyer Ordre de Mission par email
// ============================================================================
missionOrdersRoutes.post('/:intervention_id/send', async (c) => {
  try {
    const { DB } = c.env;
    const interventionId = parseInt(c.req.param('intervention_id'));
    const { email, message } = await c.req.json();

    // TODO: Implémenter envoi email via service externe (SendGrid, Resend, etc.)
    // Pour l'instant, on retourne juste un succès

    return c.json({
      success: true,
      message: 'Ordre de mission envoyé avec succès',
      email: email
    });
  } catch (error: any) {
    return c.json({ 
      error: 'Erreur lors de l\'envoi de l\'ordre de mission',
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// Fonction génération HTML Ordre de Mission
// ============================================================================
function generateMissionOrderHTML(data: any): string {
  const interventionDate = new Date(data.intervention_date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const orderNumber = `OM-${data.id.toString().padStart(6, '0')}`;
  const currentDate = new Date().toLocaleDateString('fr-FR');

  // Mapping types d'intervention
  const interventionTypes: Record<string, string> = {
    'el_audit': 'Audit Électroluminescence (EL)',
    'iv_test': 'Tests Courbes I-V',
    'thermography': 'Thermographie Infrarouge',
    'visual_inspection': 'Inspection Visuelle',
    'isolation_test': 'Tests d\'Isolation Électrique',
    'post_incident': 'Expertise Post-Sinistre',
    'commissioning': 'Commissioning Installation',
    'maintenance': 'Maintenance Préventive',
    'el': 'Audit Électroluminescence Nocturne'
  };

  const interventionTypeLabel = interventionTypes[data.intervention_type] || data.intervention_type;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ordre de Mission ${orderNumber}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-after: always; }
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333;
            background: white;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
        }
        
        /* En-tête avec logo */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2d5016;
        }
        
        .logo-section {
            flex: 1;
        }
        
        .logo-text {
            font-size: 24pt;
            font-weight: bold;
            color: #2d5016;
            margin-bottom: 5px;
        }
        
        .logo-subtitle {
            font-size: 10pt;
            color: #666;
            margin-bottom: 10px;
        }
        
        .company-info {
            font-size: 9pt;
            color: #666;
            line-height: 1.6;
        }
        
        .order-info {
            text-align: right;
            flex: 1;
        }
        
        .order-number {
            font-size: 20pt;
            font-weight: bold;
            color: #2d5016;
            margin-bottom: 10px;
        }
        
        .order-date {
            font-size: 10pt;
            color: #666;
        }
        
        /* Titre document */
        .doc-title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            color: #2d5016;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        /* Sections */
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 12pt;
            font-weight: bold;
            color: #2d5016;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .info-box {
            padding: 15px;
            background: #f9f9f9;
            border-left: 3px solid #2d5016;
        }
        
        .info-label {
            font-size: 9pt;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 11pt;
            color: #333;
        }
        
        .info-item {
            margin-bottom: 8px;
        }
        
        /* Prestations */
        .prestations-list {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
        }
        
        .prestation-item {
            padding: 10px;
            margin-bottom: 10px;
            background: white;
            border-left: 3px solid #2d5016;
        }
        
        .prestation-title {
            font-weight: bold;
            color: #2d5016;
            margin-bottom: 5px;
        }
        
        .prestation-desc {
            font-size: 10pt;
            color: #666;
        }
        
        /* Conditions */
        .conditions {
            font-size: 9pt;
            color: #666;
            line-height: 1.8;
        }
        
        .conditions ul {
            margin-left: 20px;
        }
        
        .conditions li {
            margin-bottom: 5px;
        }
        
        /* Signatures */
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 40px;
        }
        
        .signature-box {
            text-align: center;
        }
        
        .signature-label {
            font-weight: bold;
            margin-bottom: 60px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ccc;
        }
        
        .signature-name {
            font-size: 10pt;
            color: #666;
        }
        
        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            font-size: 8pt;
            color: #999;
        }
        
        /* Boutons action */
        .actions {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            font-size: 11pt;
        }
        
        .btn-print {
            background: #2d5016;
            color: white;
        }
        
        .btn-download {
            background: #666;
            color: white;
        }
        
        .btn:hover {
            opacity: 0.8;
        }
        
        .highlight-box {
            background: #fff9e6;
            border: 2px solid #ffd700;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        
        .alert-icon {
            color: #ffd700;
            font-weight: bold;
            margin-right: 5px;
        }
    </style>
</head>
<body>
    <!-- Boutons d'action -->
    <div class="actions no-print">
        <button class="btn btn-print" onclick="window.print()">
            🖨️ Imprimer
        </button>
        <button class="btn btn-download" onclick="window.print()">
            📥 Télécharger PDF
        </button>
    </div>

    <div class="container">
        <!-- En-tête -->
        <div class="header">
            <div class="logo-section">
                <div class="logo-text">DIAGNOSTIC PV</div>
                <div class="logo-subtitle">Expertise Photovoltaïque Indépendante</div>
                <div class="company-info">
                    3 rue d'Apollo, 31240 L'Union<br>
                    Tél : 05.81.10.16.59<br>
                    Email : contact@diagpv.fr<br>
                    RCS Toulouse 792 972 309
                </div>
            </div>
            <div class="order-info">
                <div class="order-number">${orderNumber}</div>
                <div class="order-date">Émis le ${currentDate}</div>
            </div>
        </div>

        <!-- Titre -->
        <div class="doc-title">ORDRE DE MISSION</div>

        <!-- Informations Client & Site -->
        <div class="info-grid">
            <div class="info-box">
                <div class="section-title">CLIENT</div>
                <div class="info-item">
                    <div class="info-label">Société</div>
                    <div class="info-value">${data.client_name || 'Non renseigné'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Contact</div>
                    <div class="info-value">${data.client_contact || 'Non renseigné'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${data.client_email || 'Non renseigné'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Téléphone</div>
                    <div class="info-value">${data.client_phone || 'Non renseigné'}</div>
                </div>
            </div>
            
            <div class="info-box">
                <div class="section-title">SITE D'INTERVENTION</div>
                <div class="info-item">
                    <div class="info-label">Projet</div>
                    <div class="info-value">${data.project_name || 'Non renseigné'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Adresse</div>
                    <div class="info-value">${data.site_address || 'Non renseigné'}</div>
                </div>
            </div>
        </div>

        <!-- Détails Intervention -->
        <div class="section">
            <div class="section-title">DÉTAILS DE L'INTERVENTION</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Date prévue</div>
                    <div class="info-value" style="font-weight: bold; font-size: 12pt;">${interventionDate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Type d'intervention</div>
                    <div class="info-value">${interventionTypeLabel}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Durée estimée</div>
                    <div class="info-value">${data.duration_hours ? data.duration_hours + ' heures' : 'À définir'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Technicien assigné</div>
                    <div class="info-value">${data.technician_name || 'À assigner'}</div>
                </div>
            </div>
        </div>

        <!-- Prestations -->
        <div class="section">
            <div class="section-title">PRESTATIONS À RÉALISER</div>
            <div class="prestations-list">
                ${generatePrestationItems(data.intervention_type)}
            </div>
        </div>

        ${data.technical_notes ? `
        <div class="highlight-box">
            <div class="info-label">
                <span class="alert-icon">⚠️</span>
                NOTES TECHNIQUES / CONSIGNES PARTICULIÈRES
            </div>
            <div style="margin-top: 10px;">${data.technical_notes}</div>
        </div>
        ` : ''}

        <!-- Conditions -->
        <div class="section">
            <div class="section-title">CONDITIONS D'INTERVENTION</div>
            <div class="conditions">
                <ul>
                    <li>Le technicien devra se présenter au contact désigné à son arrivée sur site</li>
                    <li>L'accès aux installations et aux équipements nécessaires devra être assuré</li>
                    <li>Les mesures de sécurité en vigueur sur le site devront être respectées</li>
                    <li>Les conditions météorologiques doivent permettre la réalisation des mesures en toute sécurité</li>
                    <li>Pour les audits EL : intervention nocturne requise (après 20h en été, après 18h en hiver)</li>
                    <li>Le rapport technique sera remis dans un délai maximum de 5 jours ouvrés</li>
                    <li>Toute modification de planning devra être communiquée 48h à l'avance</li>
                </ul>
            </div>
        </div>

        <!-- Signatures -->
        <div class="signatures">
            <div class="signature-box">
                <div class="signature-label">Pour Diagnostic Photovoltaïque</div>
                <div class="signature-name">Fabien CORRERA<br>Directeur Technique</div>
            </div>
            <div class="signature-box">
                <div class="signature-label">Pour le Client</div>
                <div class="signature-name">___________________<br>Nom et Cachet</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            Diagnostic Photovoltaïque - SAS au capital de 5 000€ - RCS Toulouse 792 972 309<br>
            3 rue d'Apollo, 31240 L'Union - contact@diagpv.fr - www.diagnosticphotovoltaique.fr
        </div>
    </div>

    <script>
        // Auto-print si paramètre URL
        if (window.location.search.includes('autoprint=true')) {
            window.onload = () => window.print();
        }
    </script>
</body>
</html>
  `;
}

// ============================================================================
// Génération items prestations selon type
// ============================================================================
function generatePrestationItems(type: string): string {
  const prestations: Record<string, string[]> = {
    'el_audit': [
      '<div class="prestation-item"><div class="prestation-title">📸 Audit Électroluminescence Nocturne</div><div class="prestation-desc">Prise de photos EL de l\'ensemble des modules photovoltaïques, détection microfissures, cellules mortes, défauts de soudure</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📊 Analyse et Diagnostic</div><div class="prestation-desc">Analyse des images EL, classification des défauts par niveau de sévérité, identification modules critiques</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📝 Rapport Technique Normatif</div><div class="prestation-desc">Rapport complet conforme IEC 62446-3, cartographie détaillée, préconisations hiérarchisées</div></div>'
    ],
    'iv_test': [
      '<div class="prestation-item"><div class="prestation-title">📈 Mesures Courbes I-V</div><div class="prestation-desc">Relevé courbes I-V sur strings représentatifs, mesure Voc, Isc, Pmax, FF</div></div>',
      '<div class="prestation-item"><div class="prestation-title">🔬 Analyse Performances</div><div class="prestation-desc">Comparaison avec courbes de référence, calcul pertes performances, identification mismatch</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📝 Rapport de Mesures</div><div class="prestation-desc">Rapport détaillé conforme IEC 60904-1, graphiques courbes, préconisations correctives</div></div>'
    ],
    'thermography': [
      '<div class="prestation-item"><div class="prestation-title">🌡️ Thermographie Infrarouge</div><div class="prestation-desc">Inspection thermique drone et/ou au sol, détection points chauds, défauts cellules/diodes</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📊 Analyse Thermique</div><div class="prestation-desc">Classification anomalies thermiques, corrélation avec production, évaluation risques</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📝 Rapport Thermographique</div><div class="prestation-desc">Rapport conforme DIN EN 62446-3, cartographie thermique, préconisations sécurité</div></div>'
    ],
    'visual_inspection': [
      '<div class="prestation-item"><div class="prestation-title">👁️ Inspection Visuelle Complète</div><div class="prestation-desc">Contrôle visuel modules, structures, câblages, boîtes de jonction, onduleurs</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📸 Documentation Photographique</div><div class="prestation-desc">Photos défauts mécaniques, corrosion, délamination, snail trails, fixations</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📝 Rapport d\'Inspection</div><div class="prestation-desc">Rapport détaillé conformité NF C 15-100, liste anomalies, plan d\'actions correctif</div></div>'
    ],
    'isolation_test': [
      '<div class="prestation-item"><div class="prestation-title">⚡ Tests d\'Isolation Électrique</div><div class="prestation-desc">Mesures résistance isolation DC/AC, test terre, vérification continuité</div></div>',
      '<div class="prestation-item"><div class="prestation-title">🔍 Contrôles Sécurité</div><div class="prestation-desc">Vérification seuils normatifs NF C 15-100, détection défauts isolement</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📝 Rapport de Conformité</div><div class="prestation-desc">Rapport conformité électrique, résultats mesures, actions correctives requises</div></div>'
    ],
    'post_incident': [
      '<div class="prestation-item"><div class="prestation-title">🔎 Expertise Post-Sinistre</div><div class="prestation-desc">Investigation complète origine sinistre, analyse dégâts, évaluation étendue</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📊 Évaluation Technique</div><div class="prestation-desc">Tests électriques, thermographie, EL si nécessaire, chiffrage réparations</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📝 Rapport d\'Expertise Judiciaire</div><div class="prestation-desc">Rapport expert indépendant pour assurance, responsabilités, montant préjudice</div></div>'
    ],
    'commissioning': [
      '<div class="prestation-item"><div class="prestation-title">✅ Commissioning Installation</div><div class="prestation-desc">Réception technique installation neuve, contrôles conformité, tests performances</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📋 Tests et Mesures</div><div class="prestation-desc">Courbes I-V, tests isolation, thermographie, vérification garanties constructeur</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📝 Rapport de Réception</div><div class="prestation-desc">PV de réception indépendant, conformité IEC 62446-1, levées réserves</div></div>'
    ],
    'maintenance': [
      '<div class="prestation-item"><div class="prestation-title">🔧 Maintenance Préventive</div><div class="prestation-desc">Contrôles périodiques installation, nettoyage connexions, resserrage fixations</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📊 Tests Performances</div><div class="prestation-desc">Mesures électriques, contrôle production, vérification dégradation modules</div></div>',
      '<div class="prestation-item"><div class="prestation-title">📝 Rapport de Maintenance</div><div class="prestation-desc">Rapport intervention, actions réalisées, recommandations optimisation</div></div>'
    ]
  };

  return prestations[type] || prestations['el_audit'];
}

export default missionOrdersRoutes;
