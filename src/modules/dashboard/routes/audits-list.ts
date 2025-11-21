import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const auditsListRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /api/dashboard/audits - Page centrale liste tous audits
// ============================================================================
auditsListRouter.get('/', async (c) => {
  const { DB } = c.env
  
  // Récupérer TOUS les audits depuis la table `audits` unifiée (avec données CRM)
  const { results: audits } = await DB.prepare(`
    SELECT 
      a.id,
      a.audit_token,
      a.project_name,
      a.client_name,
      a.location,
      a.modules_enabled,
      a.status,
      a.created_at,
      a.client_id,
      a.project_id,
      a.intervention_id,
      -- Données CRM/Planning
      c.company_name as crm_client_name,
      p.name as crm_project_name,
      p.site_address as crm_site_address,
      i.intervention_date,
      i.intervention_type,
      -- Données EL si disponibles
      el.total_modules,
      el.string_count
    FROM audits a
    LEFT JOIN crm_clients c ON a.client_id = c.id
    LEFT JOIN projects p ON a.project_id = p.id
    LEFT JOIN interventions i ON a.intervention_id = i.id
    LEFT JOIN el_audits el ON a.audit_token = el.audit_token
    ORDER BY a.created_at DESC
  `).all()
  
  return c.html(renderAuditsList(audits))
})

function renderAuditsList(audits: any[]) {
  const auditRows = audits.map(audit => {
    const modules = audit.modules_enabled ? JSON.parse(audit.modules_enabled) : [];
    const displayClientName = audit.crm_client_name || audit.client_name || 'N/A';
    const displayProjectName = audit.crm_project_name || audit.project_name || 'N/A';
    const displayLocation = audit.crm_site_address || audit.location || 'Localisation inconnue';
    
    return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-weight: bold; color: #1f2937;">${displayProjectName}</div>
        <div style="font-size: 12px; color: #6b7280;">
          <i class="fas fa-building" style="margin-right: 4px;"></i>${displayClientName}
        </div>
        <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">
          <i class="fas fa-map-marker-alt" style="margin-right: 4px;"></i>${displayLocation}
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${audit.total_modules ? `
          <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
            ${audit.total_modules} modules
          </span>
        ` : '<span style="color: #9ca3af; font-size: 12px;">-</span>'}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">
          ${modules.map((m: string) => `
            <span style="background: #e0e7ff; color: #4c1d95; padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 600;">
              ${m}
            </span>
          `).join('')}
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${modules.includes('EL') ? `
            <a href="/api/el/reports/complete/${audit.audit_token}" 
               target="_blank"
               style="background: #3b82f6; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
              📊 Rapport EL
            </a>
            <a href="/api/calepinage/editor/${audit.audit_token}?module_type=el" 
               target="_blank"
               style="background: #10b981; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
              ✏️ Calepinage
            </a>
          ` : ''}
          ${modules.includes('IV') ? `
            <a href="/api/iv/reports/report/${audit.audit_token}" 
               target="_blank"
               style="background: #8b5cf6; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
              📈 Courbes I-V
            </a>
          ` : ''}
          ${modules.includes('VISUAL') ? `
            <a href="/api/visual/report/${audit.audit_token}" 
               target="_blank"
               style="background: #f59e0b; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
              👁️ Visuel
            </a>
          ` : ''}
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: #6b7280; font-family: monospace;">
          <i class="fas fa-fingerprint" style="margin-right: 4px;"></i>Token: ${audit.audit_token.substring(0, 8)}...
          ${audit.intervention_date ? `<br><i class="fas fa-calendar" style="margin-right: 4px;"></i>${new Date(audit.intervention_date).toLocaleDateString('fr-FR')}` : ''}
        </div>
      </td>
    </tr>
  `}).join('')
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tous les Audits - Diagnostic Photovoltaïque</title>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .stats {
      display: flex;
      gap: 20px;
      padding: 30px 40px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .stat-card {
      flex: 1;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .content {
      padding: 40px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }
    
    thead {
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
    }
    
    th {
      padding: 16px 12px;
      text-align: left;
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    
    tbody tr:hover {
      background: #f9fafb;
    }
    
    .empty-state {
      text-align: center;
      padding: 80px 40px;
      color: #6b7280;
    }
    
    .empty-state-icon {
      font-size: 64px;
      margin-bottom: 20px;
      opacity: 0.3;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔋 Tous les Audits Photovoltaïques</h1>
      <p>Diagnostic Photovoltaïque - Vue d'ensemble complète</p>
      <div style="margin-top: 20px;">
        <a href="/api/crm-unified" 
           style="background: white; color: #3b82f6; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          <i class="fas fa-sitemap" style="margin-right: 8px;"></i>Vue CRM Unifiée
        </a>
      </div>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${audits.length}</div>
        <div class="stat-label">Audits Total</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${audits.reduce((sum, a) => sum + (a.total_modules || 0), 0)}</div>
        <div class="stat-label">Modules Total</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${audits.filter(a => a.status === 'completed').length}</div>
        <div class="stat-label">Complétés</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${audits.filter(a => a.status === 'in_progress').length}</div>
        <div class="stat-label">En Cours</div>
      </div>
    </div>
    
    <div class="content">
      ${audits.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Projet / Client / Site</th>
              <th style="text-align: center;">Modules</th>
              <th style="text-align: center;">Modules Activés</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${auditRows}
          </tbody>
        </table>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3 style="color: #1f2937; margin-bottom: 8px;">Aucun audit disponible</h3>
          <p>Créez votre premier audit pour commencer.</p>
        </div>
      `}
    </div>
  </div>
</body>
</html>
  `
}

export default auditsListRouter
