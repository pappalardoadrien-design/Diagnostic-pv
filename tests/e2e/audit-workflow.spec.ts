/**
 * TESTS E2E - WORKFLOW AUDIT COMPLET
 * 
 * Tests critiques pour workflow diagnostiqueur
 * À exécuter après déploiement production
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://diagnostic-hub.pages.dev';

test.describe('Workflow Audit EL Complet', () => {
  
  test('Créer audit EL → Upload photos → Générer PDF', async ({ page }) => {
    // 1. Navigation Dashboard
    await page.goto(`${BASE_URL}/crm/dashboard`);
    await expect(page.locator('h1')).toContainText('DASHBOARD');
    
    // 2. Créer client (si nécessaire)
    // await page.click('text=Créer Client');
    
    // 3. Créer audit EL
    await page.goto(`${BASE_URL}/audits/create`);
    await page.fill('[name="site_name"]', 'Test Site E2E');
    await page.click('button[type="submit"]');
    
    // 4. Récupérer audit_token
    await page.waitForURL(/\/audit\/.*\/complete/);
    const url = page.url();
    const audit_token = url.split('/')[4];
    
    // 5. Upload photos EL
    await page.goto(`${BASE_URL}/photos/upload/${audit_token}`);
    // await page.setInputFiles('input[type="file"]', ['test-photo.jpg']);
    
    // 6. Saisir modules
    // ... (À compléter selon workflow réel)
    
    // 7. Générer PDF
    await page.goto(`${BASE_URL}/audit/${audit_token}/complete`);
    await expect(page.locator('#progress-text')).toContainText('100%');
    await page.click('text=GÉNÉRER RAPPORT FINAL PDF');
    
    // 8. Vérifier PDF ouvert
    const [pdfPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('text=GÉNÉRER RAPPORT')
    ]);
    expect(pdfPage.url()).toContain('/rapport/print/');
  });

});

test.describe('Tests API Thermographie', () => {
  
  test('Créer mesure thermique via API', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/thermique/measurement/create`, {
      data: {
        audit_token: 'test_token',
        intervention_id: 1,
        temperature_max: 85.5,
        delta_t_max: 12.3,
        defect_type: 'hotspot',
        severity_level: 4
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.measurement_id).toBeGreaterThan(0);
  });
  
  test('Récupérer stats thermiques', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/thermique/stats/test_token`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.stats).toBeDefined();
  });

});

test.describe('Tests Performance', () => {
  
  test('Dashboard Analytics charge en <2s', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/analytics/dashboard`);
    await page.waitForSelector('#kpi-audits');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });
  
  test('API Cache KV fonctionne', async ({ request }) => {
    // Premier appel (cache miss)
    const start1 = Date.now();
    await request.get(`${BASE_URL}/api/analytics/global`);
    const time1 = Date.now() - start1;
    
    // Second appel (cache hit)
    const start2 = Date.now();
    await request.get(`${BASE_URL}/api/analytics/global`);
    const time2 = Date.now() - start2;
    
    // Cache doit être plus rapide
    expect(time2).toBeLessThan(time1 * 0.5);
  });

});

// À compléter avec 15+ tests critiques
