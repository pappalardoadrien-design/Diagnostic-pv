/**
 * Routes API - Module Isolation
 * Endpoints CRUD pour tests d'isolement IEC 62446
 */

import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import {
  type CreateIsolationTestRequest,
  type CreateIsolationTestResponse,
  type UpdateIsolationTestRequest,
  type UpdateIsolationTestResponse,
  type GetIsolationTestResponse,
  type ListIsolationTestsRequest,
  type ListIsolationTestsResponse,
  type GetPlantHistoryRequest,
  type GetPlantHistoryResponse,
  type ImportExcelRequest,
  type ImportExcelResponse,
  type IsolationTestDBRecord,
  type IsolationMeasurementHistoryDBRecord,
  generateTestToken,
  calculateTestConformity,
  dbRecordToIsolationTest,
  dbRecordToMeasurementHistory,
  DEFAULT_THRESHOLD_MOHM,
  isMeasurementConform,
  type MeasurementType
} from './types/index.js';

type Bindings = {
  DB: D1Database;
};

export const isolationRoutes = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// POST /api/isolation/test/create - Créer un nouveau test d'isolement
// ============================================================================
isolationRoutes.post('/test/create', async (c) => {
  const body: CreateIsolationTestRequest = await c.req.json();
  const { DB } = c.env;

  try {
    // Validation: Au moins une mesure requise
    if (!body.dcPositiveToEarth && !body.dcNegativeToEarth && 
        !body.dcPositiveToNegative && !body.acToEarth) {
      return c.json({
        success: false,
        error: 'Au moins une mesure d\'isolement est requise'
      }, 400);
    }

    // Génération token unique
    const testToken = generateTestToken();
    const threshold = body.thresholdMohm || DEFAULT_THRESHOLD_MOHM;

    // Calcul conformité globale
    const isConform = calculateTestConformity({
      dcPositiveToEarth: body.dcPositiveToEarth,
      dcNegativeToEarth: body.dcNegativeToEarth,
      dcPositiveToNegative: body.dcPositiveToNegative,
      acToEarth: body.acToEarth
    }, threshold);

    // Insertion test principal
    const insertResult = await DB.prepare(`
      INSERT INTO isolation_tests (
        test_token, plant_id, zone_id, audit_el_token,
        test_date, test_type, operator_name, equipment_used,
        dc_positive_to_earth, dc_negative_to_earth, dc_positive_to_negative, ac_to_earth,
        temperature_celsius, humidity_percent, weather_conditions,
        is_conform, threshold_mohm,
        notes, non_conformity_details, corrective_actions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      testToken,
      body.plantId || null,
      body.zoneId || null,
      body.auditElToken || null,
      body.testDate,
      body.testType,
      body.operatorName || null,
      body.equipmentUsed || null,
      body.dcPositiveToEarth || null,
      body.dcNegativeToEarth || null,
      body.dcPositiveToNegative || null,
      body.acToEarth || null,
      body.temperatureCelsius || null,
      body.humidityPercent || null,
      body.weatherConditions || null,
      isConform ? 1 : 0,
      threshold,
      body.notes || null,
      body.nonConformityDetails || null,
      body.correctiveActions || null
    ).run();

    const testId = insertResult.meta.last_row_id;

    // Insertion historique pour chaque mesure
    const measurements: { type: MeasurementType; value: number; conform: boolean }[] = [];
    
    if (body.dcPositiveToEarth !== undefined) {
      await DB.prepare(`
        INSERT INTO isolation_measurements_history 
        (test_id, test_token, measurement_type, measurement_value, is_conform, measured_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        testId,
        testToken,
        'DC_POS_EARTH',
        body.dcPositiveToEarth,
        isMeasurementConform(body.dcPositiveToEarth, threshold) ? 1 : 0,
        new Date().toISOString()
      ).run();
      
      measurements.push({
        type: 'DC_POS_EARTH',
        value: body.dcPositiveToEarth,
        conform: isMeasurementConform(body.dcPositiveToEarth, threshold)
      });
    }

    if (body.dcNegativeToEarth !== undefined) {
      await DB.prepare(`
        INSERT INTO isolation_measurements_history 
        (test_id, test_token, measurement_type, measurement_value, is_conform, measured_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        testId,
        testToken,
        'DC_NEG_EARTH',
        body.dcNegativeToEarth,
        isMeasurementConform(body.dcNegativeToEarth, threshold) ? 1 : 0,
        new Date().toISOString()
      ).run();
      
      measurements.push({
        type: 'DC_NEG_EARTH',
        value: body.dcNegativeToEarth,
        conform: isMeasurementConform(body.dcNegativeToEarth, threshold)
      });
    }

    if (body.dcPositiveToNegative !== undefined) {
      await DB.prepare(`
        INSERT INTO isolation_measurements_history 
        (test_id, test_token, measurement_type, measurement_value, is_conform, measured_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        testId,
        testToken,
        'DC_POS_NEG',
        body.dcPositiveToNegative,
        isMeasurementConform(body.dcPositiveToNegative, threshold) ? 1 : 0,
        new Date().toISOString()
      ).run();
      
      measurements.push({
        type: 'DC_POS_NEG',
        value: body.dcPositiveToNegative,
        conform: isMeasurementConform(body.dcPositiveToNegative, threshold)
      });
    }

    if (body.acToEarth !== undefined) {
      await DB.prepare(`
        INSERT INTO isolation_measurements_history 
        (test_id, test_token, measurement_type, measurement_value, is_conform, measured_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        testId,
        testToken,
        'AC_EARTH',
        body.acToEarth,
        isMeasurementConform(body.acToEarth, threshold) ? 1 : 0,
        new Date().toISOString()
      ).run();
      
      measurements.push({
        type: 'AC_EARTH',
        value: body.acToEarth,
        conform: isMeasurementConform(body.acToEarth, threshold)
      });
    }

    // Récupération test créé
    const testRecord = await DB.prepare(`
      SELECT * FROM isolation_tests WHERE test_token = ?
    `).bind(testToken).first<IsolationTestDBRecord>();

    if (!testRecord) {
      return c.json({ success: false, error: 'Test créé mais erreur récupération' }, 500);
    }

    const test = dbRecordToIsolationTest(testRecord);

    const response: CreateIsolationTestResponse = {
      success: true,
      test,
      conformityStatus: {
        isConform,
        threshold,
        measurements
      }
    };

    return c.json(response, 201);
  } catch (error) {
    console.error('Erreur création test isolation:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});

// ============================================================================
// GET /api/isolation/test/:token - Récupérer un test par token
// ============================================================================
isolationRoutes.get('/test/:token', async (c) => {
  const token = c.req.param('token');
  const { DB } = c.env;

  try {
    const testRecord = await DB.prepare(`
      SELECT * FROM isolation_tests WHERE test_token = ?
    `).bind(token).first<IsolationTestDBRecord>();

    if (!testRecord) {
      return c.json({ success: false, error: 'Test introuvable' }, 404);
    }

    const test = dbRecordToIsolationTest(testRecord);

    // Récupération historique mesures
    const measurementsRecords = await DB.prepare(`
      SELECT * FROM isolation_measurements_history 
      WHERE test_token = ?
      ORDER BY measured_at ASC
    `).bind(token).all<IsolationMeasurementHistoryDBRecord>();

    const measurements = measurementsRecords.results.map(dbRecordToMeasurementHistory);

    const response: GetIsolationTestResponse = {
      success: true,
      test,
      measurements
    };

    return c.json(response);
  } catch (error) {
    console.error('Erreur récupération test:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});

// ============================================================================
// PUT /api/isolation/test/:token - Mettre à jour un test
// ============================================================================
isolationRoutes.put('/test/:token', async (c) => {
  const token = c.req.param('token');
  const body: UpdateIsolationTestRequest = await c.req.json();
  const { DB } = c.env;

  try {
    // Vérifier existence test
    const existingTest = await DB.prepare(`
      SELECT * FROM isolation_tests WHERE test_token = ?
    `).bind(token).first<IsolationTestDBRecord>();

    if (!existingTest) {
      return c.json({ success: false, error: 'Test introuvable' }, 404);
    }

    // Préparer valeurs mesures (garder anciennes si non fournies)
    const dcPosEarth = body.dcPositiveToEarth !== undefined ? body.dcPositiveToEarth : existingTest.dc_positive_to_earth;
    const dcNegEarth = body.dcNegativeToEarth !== undefined ? body.dcNegativeToEarth : existingTest.dc_negative_to_earth;
    const dcPosNeg = body.dcPositiveToNegative !== undefined ? body.dcPositiveToNegative : existingTest.dc_positive_to_negative;
    const acEarth = body.acToEarth !== undefined ? body.acToEarth : existingTest.ac_to_earth;

    // Recalculer conformité
    const isConform = calculateTestConformity({
      dcPositiveToEarth: dcPosEarth ?? undefined,
      dcNegativeToEarth: dcNegEarth ?? undefined,
      dcPositiveToNegative: dcPosNeg ?? undefined,
      acToEarth: acEarth ?? undefined
    }, existingTest.threshold_mohm);

    // Mise à jour
    await DB.prepare(`
      UPDATE isolation_tests SET
        dc_positive_to_earth = ?,
        dc_negative_to_earth = ?,
        dc_positive_to_negative = ?,
        ac_to_earth = ?,
        temperature_celsius = COALESCE(?, temperature_celsius),
        humidity_percent = COALESCE(?, humidity_percent),
        weather_conditions = COALESCE(?, weather_conditions),
        notes = COALESCE(?, notes),
        non_conformity_details = COALESCE(?, non_conformity_details),
        corrective_actions = COALESCE(?, corrective_actions),
        operator_name = COALESCE(?, operator_name),
        equipment_used = COALESCE(?, equipment_used),
        is_conform = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE test_token = ?
    `).bind(
      dcPosEarth,
      dcNegEarth,
      dcPosNeg,
      acEarth,
      body.temperatureCelsius || null,
      body.humidityPercent || null,
      body.weatherConditions || null,
      body.notes || null,
      body.nonConformityDetails || null,
      body.correctiveActions || null,
      body.operatorName || null,
      body.equipmentUsed || null,
      isConform ? 1 : 0,
      token
    ).run();

    // Récupérer test mis à jour
    const updatedRecord = await DB.prepare(`
      SELECT * FROM isolation_tests WHERE test_token = ?
    `).bind(token).first<IsolationTestDBRecord>();

    if (!updatedRecord) {
      return c.json({ success: false, error: 'Erreur récupération après update' }, 500);
    }

    const test = dbRecordToIsolationTest(updatedRecord);

    const response: UpdateIsolationTestResponse = {
      success: true,
      test,
      conformityStatus: {
        isConform,
        changedFrom: existingTest.is_conform !== isConform ? Boolean(existingTest.is_conform) : undefined
      }
    };

    return c.json(response);
  } catch (error) {
    console.error('Erreur mise à jour test:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});

// ============================================================================
// DELETE /api/isolation/test/:token - Supprimer un test
// ============================================================================
isolationRoutes.delete('/test/:token', async (c) => {
  const token = c.req.param('token');
  const { DB } = c.env;

  try {
    const result = await DB.prepare(`
      DELETE FROM isolation_tests WHERE test_token = ?
    `).bind(token).run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Test introuvable' }, 404);
    }

    return c.json({ success: true, message: 'Test supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression test:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});

// ============================================================================
// GET /api/isolation/tests - Lister tous les tests avec filtres
// ============================================================================
isolationRoutes.get('/tests', async (c) => {
  const { DB } = c.env;

  try {
    // Parse query params
    const plantId = c.req.query('plantId') ? parseInt(c.req.query('plantId')!) : undefined;
    const zoneId = c.req.query('zoneId') ? parseInt(c.req.query('zoneId')!) : undefined;
    const auditElToken = c.req.query('auditElToken');
    const testType = c.req.query('testType');
    const isConform = c.req.query('isConform') === 'true' ? true : (c.req.query('isConform') === 'false' ? false : undefined);
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0;

    // Construction requête dynamique
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (plantId) {
      whereConditions.push('plant_id = ?');
      params.push(plantId);
    }
    if (zoneId) {
      whereConditions.push('zone_id = ?');
      params.push(zoneId);
    }
    if (auditElToken) {
      whereConditions.push('audit_el_token = ?');
      params.push(auditElToken);
    }
    if (testType) {
      whereConditions.push('test_type = ?');
      params.push(testType);
    }
    if (isConform !== undefined) {
      whereConditions.push('is_conform = ?');
      params.push(isConform ? 1 : 0);
    }
    if (startDate) {
      whereConditions.push('test_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('test_date <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Récupération tests
    const testsQuery = `
      SELECT * FROM isolation_tests 
      ${whereClause}
      ORDER BY test_date DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const testsRecords = await DB.prepare(testsQuery).bind(...params).all<IsolationTestDBRecord>();
    const tests = testsRecords.results.map(dbRecordToIsolationTest);

    // Statistiques globales (sans pagination)
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_conform = 1 THEN 1 ELSE 0 END) as conform_count,
        SUM(CASE WHEN is_conform = 0 THEN 1 ELSE 0 END) as non_conform_count
      FROM isolation_tests
      ${whereClause}
    `;
    const statsParams = whereConditions.length > 0 ? params.slice(0, -2) : []; // Enlever limit/offset
    const statsRecord = await DB.prepare(statsQuery).bind(...statsParams).first<{
      total: number;
      conform_count: number;
      non_conform_count: number;
    }>();

    const totalTests = statsRecord?.total || 0;
    const conformTests = statsRecord?.conform_count || 0;
    const nonConformTests = statsRecord?.non_conform_count || 0;
    const conformityRate = totalTests > 0 ? (conformTests / totalTests) * 100 : 0;

    const response: ListIsolationTestsResponse = {
      success: true,
      tests,
      total: totalTests,
      stats: {
        totalTests,
        conformTests,
        nonConformTests,
        conformityRate: Math.round(conformityRate * 100) / 100
      }
    };

    return c.json(response);
  } catch (error) {
    console.error('Erreur listing tests:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});

// ============================================================================
// GET /api/isolation/plant/:plantId/history - Historique mesures centrale
// ============================================================================
isolationRoutes.get('/plant/:plantId/history', async (c) => {
  const plantId = parseInt(c.req.param('plantId'));
  const { DB } = c.env;

  try {
    const measurementType = c.req.query('measurementType') as MeasurementType | undefined;
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    // Construction requête
    let whereConditions = ['it.plant_id = ?'];
    let params: any[] = [plantId];

    if (measurementType) {
      whereConditions.push('imh.measurement_type = ?');
      params.push(measurementType);
    }
    if (startDate) {
      whereConditions.push('imh.measured_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('imh.measured_at <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');

    // Récupération mesures
    const measurementsQuery = `
      SELECT imh.* FROM isolation_measurements_history imh
      JOIN isolation_tests it ON imh.test_id = it.id
      WHERE ${whereClause}
      ORDER BY imh.measured_at ASC
    `;

    const measurementsRecords = await DB.prepare(measurementsQuery).bind(...params).all<IsolationMeasurementHistoryDBRecord>();
    const measurements = measurementsRecords.results.map(dbRecordToMeasurementHistory);

    // Calcul statistiques
    const values = measurements.map(m => m.measurementValue);
    const totalMeasurements = values.length;
    const averageValue = totalMeasurements > 0 ? values.reduce((a, b) => a + b, 0) / totalMeasurements : 0;
    const minValue = totalMeasurements > 0 ? Math.min(...values) : 0;
    const maxValue = totalMeasurements > 0 ? Math.max(...values) : 0;
    const conformCount = measurements.filter(m => m.isConform).length;
    const conformityRate = totalMeasurements > 0 ? (conformCount / totalMeasurements) * 100 : 0;

    // Calcul tendance (3 dernières vs 3 premières)
    let trend: 'stable' | 'improving' | 'degrading' = 'stable';
    if (totalMeasurements >= 6) {
      const firstThree = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const lastThree = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const change = ((lastThree - firstThree) / firstThree) * 100;
      
      if (change > 5) trend = 'improving';
      else if (change < -5) trend = 'degrading';
    }

    const response: GetPlantHistoryResponse = {
      success: true,
      plantId,
      measurements,
      stats: {
        totalMeasurements,
        averageValue: Math.round(averageValue * 100) / 100,
        minValue: Math.round(minValue * 100) / 100,
        maxValue: Math.round(maxValue * 100) / 100,
        conformityRate: Math.round(conformityRate * 100) / 100,
        trend
      }
    };

    return c.json(response);
  } catch (error) {
    console.error('Erreur historique centrale:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});

// ============================================================================
// POST /api/isolation/import/excel - Import Excel Benning (TODO)
// ============================================================================
isolationRoutes.post('/import/excel', async (c) => {
  // TODO: Implémenter parsing Excel Benning
  // Pour l'instant, endpoint placeholder
  
  return c.json({
    success: false,
    error: 'Import Excel non implémenté - TODO Phase suivante'
  }, 501);
});
