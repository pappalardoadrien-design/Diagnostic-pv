// ============================================================================
// MODULE I-V - ROUTES API
// ============================================================================
// Gestion courbes I-V (référence et sombres)

import { Hono } from 'hono';
import { cache, cacheInvalidator } from '../../../middleware/cache';
import ivReportsRoutes from './reports';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
};

const ivRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// GET /api/iv/measurements/:token - Liste mesures I-V d'un audit
// ============================================================================
ivRoutes.get('/measurements/:token', 
  cache({ ttl: 1800, namespace: 'iv:measurements:' }), 
  async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    const type = c.req.query('type'); // 'reference' ou 'dark'

    let query = `
      SELECT * FROM iv_measurements 
      WHERE audit_token = ?
    `;

    const params: any[] = [token];

    if (type) {
      query += ` AND measurement_type = ?`;
      params.push(type);
    }

    query += ` ORDER BY string_number, module_number`;

    const stmt = DB.prepare(query).bind(...params);
    const { results } = await stmt.all();

    return c.json({
      success: true,
      measurements: results || [],
      total: results?.length || 0,
      audit_token: token
    });

  } catch (error: any) {
    console.error('Erreur GET /measurements/:token:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur récupération mesures: ' + error.message 
    }, 500);
  }
});

// ============================================================================
// POST /api/iv/measurements/:token - Importer mesures I-V depuis CSV
// ============================================================================
ivRoutes.post('/measurements/:token', 
  cacheInvalidator('iv:measurements:'), 
  async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    const { measurements, measurement_type } = await c.req.json();

    if (!measurements || !Array.isArray(measurements) || measurements.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Aucune mesure fournie' 
      }, 400);
    }

    if (!measurement_type || !['reference', 'dark'].includes(measurement_type)) {
      return c.json({ 
        success: false, 
        error: 'measurement_type requis: reference ou dark' 
      }, 400);
    }

    // Suppression anciennes mesures du même type
    await DB.prepare(`
      DELETE FROM iv_measurements 
      WHERE audit_token = ? AND measurement_type = ?
    `).bind(token, measurement_type).run();

    let linkedCount = 0;
    let unlinkedCount = 0;

    // Insertion nouvelles mesures
    for (const m of measurements) {
      // Génération module_identifier
      const moduleIdentifier = m.string_number && m.module_number
        ? `S${m.string_number}-${m.module_number}`
        : null;

      // Vérifier liaison avec el_modules
      let elModuleExists = false;
      if (moduleIdentifier) {
        const elModule = await DB.prepare(`
          SELECT id FROM el_modules 
          WHERE audit_token = ? AND module_identifier = ?
        `).bind(token, moduleIdentifier).first();
        
        elModuleExists = !!elModule;
        if (elModuleExists) linkedCount++;
        else unlinkedCount++;
      } else {
        unlinkedCount++;
      }

      await DB.prepare(`
        INSERT INTO iv_measurements (
          audit_token, module_identifier,
          string_number, module_number, measurement_type,
          isc, voc, pmax, impp, vmpp, fill_factor,
          rs, rsh, iv_curve_data, pv_curve_data,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        token, moduleIdentifier,
        m.string_number, m.module_number, measurement_type,
        m.isc || null, m.voc || null, m.pmax || null,
        m.impp || null, m.vmpp || null, m.fill_factor || null,
        m.rs || null, m.rsh || null,
        m.iv_curve_data ? JSON.stringify(m.iv_curve_data) : null,
        m.pv_curve_data ? JSON.stringify(m.pv_curve_data) : null
      ).run();
    }

    return c.json({
      success: true,
      saved: measurements.length,
      measurement_type,
      linked_to_el_modules: linkedCount,
      unlinked: unlinkedCount,
      message: linkedCount > 0 
        ? `✅ ${linkedCount}/${measurements.length} mesures ${measurement_type} liées aux modules EL`
        : `⚠️ Aucun module EL trouvé (${unlinkedCount} mesures non liées)`
    });

  } catch (error: any) {
    console.error('Erreur POST /measurements/:token:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur import mesures: ' + error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/iv/measurements/:token/module/:identifier - Mesure d'un module
// ============================================================================
ivRoutes.get('/measurements/:token/module/:identifier', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    const identifier = c.req.param('identifier');

    const { results } = await DB.prepare(`
      SELECT * FROM iv_measurements 
      WHERE audit_token = ? AND module_identifier = ?
      ORDER BY measurement_type
    `).bind(token, identifier).all();

    if (!results || results.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Aucune mesure trouvée pour ce module' 
      }, 404);
    }

    const reference = results.find((m: any) => m.measurement_type === 'reference');
    const dark = results.find((m: any) => m.measurement_type === 'dark');

    return c.json({
      success: true,
      module_identifier: identifier,
      reference: reference || null,
      dark: dark || null
    });

  } catch (error: any) {
    console.error('Erreur GET /measurements/:token/module/:identifier:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur récupération mesure: ' + error.message 
    }, 500);
  }
});

// ============================================================================
// DELETE /api/iv/measurements/:token - Supprimer toutes les mesures d'un audit
// ============================================================================
ivRoutes.delete('/measurements/:token', 
  cacheInvalidator('iv:measurements:'), 
  async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');
    const type = c.req.query('type'); // Optionnel: 'reference' ou 'dark'

    let query = 'DELETE FROM iv_measurements WHERE audit_token = ?';
    const params: any[] = [token];

    if (type) {
      query += ' AND measurement_type = ?';
      params.push(type);
    }

    await DB.prepare(query).bind(...params).run();

    return c.json({
      success: true,
      message: type 
        ? `Mesures ${type} supprimées avec succès`
        : 'Toutes les mesures supprimées avec succès'
    });

  } catch (error: any) {
    console.error('Erreur DELETE /measurements/:token:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur suppression mesures: ' + error.message 
    }, 500);
  }
});

// ============================================================================
// GET /api/iv/report/:token - Générer rapport PDF courbes I-V
// ============================================================================
ivRoutes.get('/report/:token', async (c) => {
  try {
    const { DB } = c.env;
    const token = c.req.param('token');

    // Récupérer audit info
    const audit = await DB.prepare(`
      SELECT * FROM el_audits WHERE audit_token = ?
    `).bind(token).first();

    if (!audit) {
      return c.json({ 
        success: false, 
        error: 'Audit non trouvé' 
      }, 404);
    }

    // Récupérer mesures I-V
    const { results: measurements } = await DB.prepare(`
      SELECT * FROM iv_measurements 
      WHERE audit_token = ?
      ORDER BY string_number, module_number, measurement_type
    `).bind(token).all();

    const refCount = measurements?.filter((m: any) => m.measurement_type === 'reference').length || 0;
    const darkCount = measurements?.filter((m: any) => m.measurement_type === 'dark').length || 0;

    // Générer HTML rapport
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Courbes I-V - ${audit.project_name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #ea580c; border-bottom: 3px solid #facc15; padding-bottom: 10px; }
        .info-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .stat-box { background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #ddd; text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; color: #ea580c; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #ea580c; color: white; padding: 10px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
    </style>
</head>
<body>
    <button onclick="window.print()" style="background: #ea580c; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">
        📄 Imprimer / Enregistrer PDF
    </button>

    <h1>🔋 RAPPORT COURBES I-V</h1>
    
    <div class="info-box">
        <p><strong>Projet:</strong> ${audit.project_name}</p>
        <p><strong>Client:</strong> ${audit.client_name}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><strong>Token Audit:</strong> ${token}</p>
    </div>

    <h2>📊 Statistiques</h2>
    <div class="stats">
        <div class="stat-box">
            <div class="stat-number">${measurements?.length || 0}</div>
            <div>Total Mesures</div>
        </div>
        <div class="stat-box">
            <div class="stat-number">${refCount}</div>
            <div>Courbes Référence</div>
        </div>
        <div class="stat-box">
            <div class="stat-number">${darkCount}</div>
            <div>Courbes Sombres</div>
        </div>
    </div>

    <h2>📋 Liste des Mesures</h2>
    <table>
        <thead>
            <tr>
                <th>Module</th>
                <th>Type</th>
                <th>Isc (A)</th>
                <th>Voc (V)</th>
                <th>Pmax (W)</th>
                <th>FF</th>
                <th>Rs (Ω)</th>
                <th>Rsh (Ω)</th>
            </tr>
        </thead>
        <tbody>
            ${measurements?.map((m: any) => `
                <tr>
                    <td>${m.module_identifier || `S${m.string_number}-${m.module_number}`}</td>
                    <td>${m.measurement_type === 'reference' ? '☀️ Référence' : '🌙 Sombre'}</td>
                    <td>${m.isc ? m.isc.toFixed(2) : '-'}</td>
                    <td>${m.voc ? m.voc.toFixed(2) : '-'}</td>
                    <td>${m.pmax ? m.pmax.toFixed(2) : '-'}</td>
                    <td>${m.fill_factor ? m.fill_factor.toFixed(3) : '-'}</td>
                    <td>${m.rs ? m.rs.toFixed(3) : '-'}</td>
                    <td>${m.rsh ? m.rsh.toFixed(1) : '-'}</td>
                </tr>
            `).join('') || '<tr><td colspan="8">Aucune mesure disponible</td></tr>'}
        </tbody>
    </table>

    <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; font-size: 12px; color: #666;">
        <p><strong>Diagnostic Photovoltaïque - DiagPV</strong></p>
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    </div>
</body>
</html>
    `;

    return c.html(html);

  } catch (error: any) {
    console.error('Erreur GET /report/:token:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur génération rapport: ' + error.message 
    }, 500);
  }
});

// Mount reports routes
ivRoutes.route('/reports', ivReportsRoutes);

export default ivRoutes;
