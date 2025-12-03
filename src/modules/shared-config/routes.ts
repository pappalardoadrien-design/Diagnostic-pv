/**
 * API Routes - Configuration Partagée DiagPV Hub
 * ================================================
 * Gestion centralisée des configurations PV pour tous les modules
 * 
 * @author DiagPV Hub
 * @date 2025-12-03
 */

import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { SharedConfigService, calculateTotalModules, calculateTotalPower, generateModulesList } from '../../services/shared-config.service';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// GET /api/shared-config/:audit_token
// ============================================================================
// Récupère la configuration partagée d'un audit

app.get('/:audit_token', async (c) => {
  const auditToken = c.req.param('audit_token');
  const service = new SharedConfigService(c.env.DB);

  try {
    const config = await service.getConfigByAuditToken(auditToken);

    if (!config) {
      return c.json({ error: 'Configuration introuvable' }, 404);
    }

    // Calculer les métadonnées supplémentaires
    const totalModules = calculateTotalModules(config);
    const totalPower = calculateTotalPower(config);
    const advancedConfig = service.parseAdvancedConfig(config);

    return c.json({
      success: true,
      config: {
        ...config,
        total_modules: totalModules,
        total_power_kwc: totalPower,
        advanced_config_parsed: advancedConfig
      }
    });
  } catch (error) {
    console.error('❌ Erreur GET /api/shared-config/:audit_token:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// POST /api/shared-config
// ============================================================================
// Crée ou met à jour une configuration partagée

app.post('/', async (c) => {
  const service = new SharedConfigService(c.env.DB);

  try {
    const body = await c.req.json();

    const {
      audit_token,
      audit_id,
      string_count,
      modules_per_string,
      advanced_config,
      is_advanced_mode,
      module_model,
      module_power_wp,
      created_by
    } = body;

    if (!audit_token) {
      return c.json({ error: 'audit_token requis' }, 400);
    }

    const config = await service.upsertConfiguration({
      audit_token,
      audit_id,
      string_count,
      modules_per_string,
      advanced_config,
      is_advanced_mode,
      module_model,
      module_power_wp,
      created_by
    });

    return c.json({
      success: true,
      message: 'Configuration enregistrée',
      config
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/shared-config:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// GET /api/shared-config/:audit_token/modules
// ============================================================================
// Génère la liste complète des modules depuis la configuration

app.get('/:audit_token/modules', async (c) => {
  const auditToken = c.req.param('audit_token');
  const service = new SharedConfigService(c.env.DB);

  try {
    const config = await service.getConfigByAuditToken(auditToken);

    if (!config) {
      return c.json({ error: 'Configuration introuvable' }, 404);
    }

    const modulesList = generateModulesList(config);

    return c.json({
      success: true,
      audit_token: auditToken,
      total_modules: modulesList.length,
      modules: modulesList
    });
  } catch (error) {
    console.error('❌ Erreur GET /api/shared-config/:audit_token/modules:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// GET /api/shared-config/:audit_token/sync-status
// ============================================================================
// Récupère le statut de synchronisation de tous les modules

app.get('/:audit_token/sync-status', async (c) => {
  const auditToken = c.req.param('audit_token');
  const service = new SharedConfigService(c.env.DB);

  try {
    const syncStatus = await service.getModuleSyncStatus(auditToken);

    return c.json({
      success: true,
      audit_token: auditToken,
      modules: syncStatus
    });
  } catch (error) {
    console.error('❌ Erreur GET /api/shared-config/:audit_token/sync-status:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// POST /api/shared-config/:audit_token/validate
// ============================================================================
// Valide (verrouille) une configuration

app.post('/:audit_token/validate', async (c) => {
  const auditToken = c.req.param('audit_token');
  const service = new SharedConfigService(c.env.DB);

  try {
    const body = await c.req.json();
    const { validated_by } = body;

    if (!validated_by) {
      return c.json({ error: 'validated_by requis' }, 400);
    }

    await service.validateConfiguration(auditToken, validated_by);

    return c.json({
      success: true,
      message: 'Configuration validée et verrouillée'
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/shared-config/:audit_token/validate:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// POST /api/shared-config/:audit_token/unlock
// ============================================================================
// Déverrouille une configuration

app.post('/:audit_token/unlock', async (c) => {
  const auditToken = c.req.param('audit_token');
  const service = new SharedConfigService(c.env.DB);

  try {
    await service.unlockConfiguration(auditToken);

    return c.json({
      success: true,
      message: 'Configuration déverrouillée'
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/shared-config/:audit_token/unlock:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// POST /api/shared-config/:audit_token/sync
// ============================================================================
// Enregistre la synchronisation d'un module

app.post('/:audit_token/sync', async (c) => {
  const auditToken = c.req.param('audit_token');
  const service = new SharedConfigService(c.env.DB);

  try {
    const body = await c.req.json();
    const { module_type, module_table, sync_status, sync_error } = body;

    if (!module_type || !module_table || !sync_status) {
      return c.json({ error: 'Champs requis: module_type, module_table, sync_status' }, 400);
    }

    await service.recordModuleSync({
      audit_token: auditToken,
      module_type,
      module_table,
      sync_status,
      sync_error
    });

    return c.json({
      success: true,
      message: 'Synchronisation enregistrée'
    });
  } catch (error) {
    console.error('❌ Erreur POST /api/shared-config/:audit_token/sync:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default app;
