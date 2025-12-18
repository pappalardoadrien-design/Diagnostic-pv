/**
 * Routes API pour intégration Picsellia
 * Upload photos, analyse IA, validation humaine
 */

import { Hono } from 'hono';
import { createPicselliaClient } from './api-client.js';
import { uploadPhotoToR2, generateR2Key, base64ToArrayBuffer } from './storage.js';
import type { 
  PhotoUploadRequest, 
  PhotoUploadResponse,
  ELPhoto,
  ValidationAction,
  AnalysisStatistics
} from './types.js';

type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  PICSELLIA_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * POST /upload-photos
 * Upload batch photos pour un audit
 */
app.post('/upload-photos', async (c) => {
  const { DB, R2 } = c.env;
  
  try {
    const request = await c.req.json<PhotoUploadRequest>();
    const { audit_token, photos, uploaded_by } = request;

    if (!photos || photos.length === 0) {
      return c.json({ error: 'Aucune photo à uploader' }, 400);
    }

    // Vérifier que audit existe
    const audit = await DB.prepare(`
      SELECT audit_token, audit_date, location 
      FROM el_audits 
      WHERE audit_token = ?
    `).bind(audit_token).first<any>();

    if (!audit) {
      return c.json({ error: 'Audit non trouvé' }, 404);
    }

    const results: PhotoUploadResponse['photos'] = [];
    let uploadedCount = 0;
    let failedCount = 0;

    // Upload chaque photo
    for (const photo of photos) {
      try {
        // Convertir Base64 en ArrayBuffer
        const photoData = base64ToArrayBuffer(photo.file_data);

        // Upload vers R2
        const uploadResult = await uploadPhotoToR2(
          R2,
          photoData,
          {
            audit_token,
            module_id: photo.module_id,
            string_number: photo.string_number,
            file_name: photo.file_name,
            uploaded_by
          },
          'original'
        );

        if (!uploadResult.success) {
          results.push({
            module_id: photo.module_id,
            status: 'failed',
            error: uploadResult.error
          });
          failedCount++;
          continue;
        }

        // Enregistrer métadonnées en DB
        await DB.prepare(`
          INSERT INTO el_photos (
            audit_token, module_id, string_number,
            photo_url, file_name, file_size, file_type,
            uploaded_by, audit_date, location,
            ai_status, manual_tag, manual_comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
          ON CONFLICT(audit_token, module_id) DO UPDATE SET
            photo_url = excluded.photo_url,
            file_name = excluded.file_name,
            file_size = excluded.file_size,
            uploaded_at = datetime('now'),
            uploaded_by = excluded.uploaded_by,
            manual_tag = excluded.manual_tag,
            manual_comment = excluded.manual_comment
        `).bind(
          audit_token,
          photo.module_id,
          photo.string_number,
          uploadResult.public_url,
          photo.file_name,
          photo.file_size,
          photo.file_type,
          uploaded_by || null,
          audit.audit_date,
          audit.location,
          photo.manual_tag,
          photo.manual_comment
        ).run();

        results.push({
          module_id: photo.module_id,
          status: 'uploaded',
          photo_url: uploadResult.public_url
        });
        uploadedCount++;
      } catch (error) {
        console.error(`Erreur upload photo ${photo.module_id}:`, error);
        results.push({
          module_id: photo.module_id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Upload failed'
        });
        failedCount++;
      }
    }

    return c.json({
      success: true,
      uploaded: uploadedCount,
      failed: failedCount,
      photos: results
    }, 201);
  } catch (error) {
    console.error('Erreur upload photos:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Erreur upload photos' 
    }, 500);
  }
});

/**
 * GET /photos/:auditToken
 * Liste toutes les photos d'un audit
 */
app.get('/photos/:auditToken', async (c) => {
  const { DB } = c.env;
  const auditToken = c.req.param('auditToken');

  try {
    const photos = await DB.prepare(`
      SELECT * FROM el_photos
      WHERE audit_token = ?
      ORDER BY string_number, module_id
    `).bind(auditToken).all<ELPhoto>();

    return c.json({
      success: true,
      audit_token: auditToken,
      total: photos.results?.length || 0,
      photos: photos.results || []
    });
  } catch (error) {
    console.error('Erreur récupération photos:', error);
    return c.json({ error: 'Erreur récupération photos' }, 500);
  }
});

/**
 * POST /analyze-audit
 * Lancer analyse IA Picsellia pour toutes photos d'un audit
 */
app.post('/analyze-audit', async (c) => {
  const { DB, PICSELLIA_API_KEY } = c.env;

  try {
    const { audit_token } = await c.req.json<{ audit_token: string }>();

    // Récupérer photos non analysées
    const photos = await DB.prepare(`
      SELECT * FROM el_photos
      WHERE audit_token = ? AND ai_analyzed = 0 AND ai_status != 'failed'
    `).bind(audit_token).all<ELPhoto>();

    if (!photos.results || photos.results.length === 0) {
      return c.json({ 
        success: true, 
        message: 'Aucune photo à analyser',
        analyzed: 0 
      });
    }

    // Créer client Picsellia
    const picselliaClient = createPicselliaClient(PICSELLIA_API_KEY);

    // Marquer photos en cours d'analyse
    for (const photo of photos.results) {
      await DB.prepare(`
        UPDATE el_photos SET ai_status = 'analyzing' WHERE id = ?
      `).bind(photo.id).run();
    }

    // Lancer analyse batch
    const analysisResults = await picselliaClient.batchAnalyze({
      images: photos.results.map(p => ({
        image_url: p.photo_url,
        module_id: p.module_id
      })),
      audit_token,
      options: {
        return_annotated: true,
        min_confidence: 0.5
      }
    });

    // Mettre à jour DB avec résultats
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < analysisResults.length; i++) {
      const result = analysisResults[i];
      const photo = photos.results[i];

      if (result.status === 'success') {
        await DB.prepare(`
          UPDATE el_photos SET
            ai_analyzed = 1,
            ai_analyzed_at = datetime('now'),
            ai_confidence = ?,
            ai_defects_detected = ?,
            ai_status = 'completed',
            ai_processing_time_ms = ?,
            photo_annotated_url = ?
          WHERE id = ?
        `).bind(
          result.confidence_score,
          JSON.stringify(result.defects),
          result.processing_time_ms,
          result.annotated_image_url || null,
          photo.id
        ).run();
        
        successCount++;
      } else {
        await DB.prepare(`
          UPDATE el_photos SET
            ai_status = 'failed',
            ai_error = ?
          WHERE id = ?
        `).bind(
          result.error_message || 'Unknown error',
          photo.id
        ).run();
        
        failedCount++;
      }
    }

    return c.json({
      success: true,
      analyzed: successCount,
      failed: failedCount,
      total: photos.results.length
    });
  } catch (error) {
    console.error('Erreur analyse IA:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Erreur analyse IA' 
    }, 500);
  }
});

/**
 * GET /review/:auditToken
 * Interface validation humaine - comparaison manuel vs IA
 */
app.get('/review/:auditToken', async (c) => {
  const { DB } = c.env;
  const auditToken = c.req.param('auditToken');

  try {
    // Récupérer comparaison saisie manuelle vs IA
    const comparison = await DB.prepare(`
      SELECT 
        p.id as photo_id,
        p.module_id,
        p.photo_url,
        p.photo_annotated_url,
        p.ai_confidence,
        p.ai_defects_detected,
        p.ai_status,
        p.human_validated,
        p.validation_action,
        p.validation_notes,
        m.defect_type as manual_defect,
        m.remarks as manual_remarks
      FROM el_photos p
      LEFT JOIN el_module_measurements m 
        ON p.module_id = m.module_identifier 
        AND p.audit_token = m.audit_token
      WHERE p.audit_token = ? AND p.ai_analyzed = 1
      ORDER BY p.string_number, p.module_id
    `).bind(auditToken).all<any>();

    // Calculer statistiques de concordance
    let identical = 0;
    let different = 0;
    let aiOnly = 0;
    let manualOnly = 0;

    const items = (comparison.results || []).map((row: any) => {
      let matchStatus = 'unknown';
      
      if (row.manual_defect && row.ai_defects_detected) {
        // Comparer défauts
        matchStatus = 'partial'; // Simplification
      } else if (row.ai_defects_detected && !row.manual_defect) {
        matchStatus = 'ai_only';
        aiOnly++;
      } else if (row.manual_defect && !row.ai_defects_detected) {
        matchStatus = 'manual_only';
        manualOnly++;
      }

      return {
        ...row,
        match_status: matchStatus,
        ai_defects: row.ai_defects_detected ? JSON.parse(row.ai_defects_detected) : []
      };
    });

    return c.json({
      success: true,
      audit_token: auditToken,
      total_items: items.length,
      statistics: {
        identical,
        different,
        ai_only: aiOnly,
        manual_only: manualOnly
      },
      items
    });
  } catch (error) {
    console.error('Erreur récupération review:', error);
    return c.json({ error: 'Erreur récupération review' }, 500);
  }
});

/**
 * POST /validate
 * Valider/corriger résultats IA
 */
app.post('/validate', async (c) => {
  const { DB } = c.env;

  try {
    const action = await c.req.json<ValidationAction>();

    await DB.prepare(`
      UPDATE el_photos SET
        human_validated = 1,
        validated_by = ?,
        validated_at = datetime('now'),
        validation_action = ?,
        validation_notes = ?
      WHERE id = ?
    `).bind(
      action.validated_by,
      action.action,
      action.notes || null,
      action.photo_id
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Erreur validation:', error);
    return c.json({ error: 'Erreur validation' }, 500);
  }
});

/**
 * GET /statistics/:auditToken
 * Statistiques analyse IA pour un audit
 */
app.get('/statistics/:auditToken', async (c) => {
  const { DB } = c.env;
  const auditToken = c.req.param('auditToken');

  try {
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_photos,
        SUM(CASE WHEN ai_analyzed = 1 THEN 1 ELSE 0 END) as analyzed_photos,
        SUM(CASE WHEN ai_status = 'pending' THEN 1 ELSE 0 END) as pending_analysis,
        SUM(CASE WHEN ai_status = 'failed' THEN 1 ELSE 0 END) as failed_analysis,
        AVG(ai_confidence) as avg_confidence,
        SUM(CASE WHEN human_validated = 1 THEN 1 ELSE 0 END) as total_validated,
        SUM(CASE WHEN validation_action = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN validation_action = 'corrected' THEN 1 ELSE 0 END) as corrected,
        SUM(CASE WHEN validation_action = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM el_photos
      WHERE audit_token = ?
    `).bind(auditToken).first<any>();

    return c.json({
      success: true,
      audit_token: auditToken,
      ...stats
    });
  } catch (error) {
    console.error('Erreur statistiques:', error);
    return c.json({ error: 'Erreur statistiques' }, 500);
  }
});

export default app;
