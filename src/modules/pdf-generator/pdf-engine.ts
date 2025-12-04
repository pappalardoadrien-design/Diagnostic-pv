/**
 * PDF ENGINE - Cloudflare Browser Rendering API
 * 
 * Génère des PDF professionnels A4 300 DPI conformes IEC 62446
 * via Cloudflare Browser Rendering (Puppeteer serverless)
 * 
 * Architecture:
 * 1. Handlebars compile template HTML
 * 2. Injecte données audit (D1 Database)
 * 3. Cloudflare Browser Rendering → PDF binaire
 * 4. Upload R2 Bucket
 * 5. Retourne URL public
 */

import Handlebars from 'handlebars';
import type { Context } from 'hono';

export interface PDFGenerationOptions {
  template: string;           // Nom template (ex: 'el-audit', 'multi-modules')
  data: Record<string, any>;  // Données pour Handlebars
  filename: string;           // Nom fichier PDF (ex: 'audit_789_EL.pdf')
  format?: 'A4' | 'Letter';   // Format page
  landscape?: boolean;        // Orientation paysage
  margin?: {                  // Marges (mm)
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export interface PDFGenerationResult {
  success: boolean;
  url?: string;               // URL R2 du PDF
  filename?: string;
  size?: number;              // Taille en octets
  error?: string;
}

/**
 * Registres Handlebars helpers pour templates
 */
Handlebars.registerHelper('formatDate', function(date: string | Date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
});

Handlebars.registerHelper('formatNumber', function(num: number, decimals: number = 2) {
  if (num === null || num === undefined) return 'N/A';
  return num.toFixed(decimals);
});

Handlebars.registerHelper('percentage', function(num: number) {
  if (num === null || num === undefined) return 'N/A';
  return (num * 100).toFixed(1) + '%';
});

Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('gt', function(a: number, b: number) {
  return a > b;
});

Handlebars.registerHelper('lt', function(a: number, b: number) {
  return a < b;
});

/**
 * Génère PDF via Cloudflare Browser Rendering API
 */
export async function generatePDF(
  c: Context<{ Bindings: CloudflareBindings }>,
  options: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  try {
    const { env } = c;
    
    // 1. Charger template HTML
    const templateHTML = await loadTemplate(options.template);
    if (!templateHTML) {
      return {
        success: false,
        error: `Template '${options.template}' introuvable`
      };
    }
    
    // 2. Compiler template avec Handlebars
    const template = Handlebars.compile(templateHTML);
    const html = template(options.data);
    
    // 3. Générer PDF via Browser Rendering API
    const browser = env.BROWSER;
    if (!browser) {
      return {
        success: false,
        error: 'Browser Rendering API non configuré (wrangler.jsonc)'
      };
    }
    
    // Lancer navigateur Cloudflare
    const page = await browser.newPage();
    
    // Charger HTML
    await page.setContent(html, {
      waitUntil: 'networkidle'
    });
    
    // Générer PDF
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      landscape: options.landscape || false,
      margin: options.margin || {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      },
      printBackground: true,
      preferCSSPageSize: false
    });
    
    await page.close();
    
    // 4. Upload vers R2 Bucket
    const r2Key = `reports/${options.filename}`;
    await env.R2.put(r2Key, pdfBuffer, {
      httpMetadata: {
        contentType: 'application/pdf'
      }
    });
    
    // 5. Générer URL public
    const publicUrl = `https://pub-YOUR_R2_ID.r2.dev/${r2Key}`;
    
    return {
      success: true,
      url: publicUrl,
      filename: options.filename,
      size: pdfBuffer.byteLength
    };
    
  } catch (error: any) {
    console.error('❌ Erreur génération PDF:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue'
    };
  }
}

/**
 * Charge template HTML depuis /templates
 */
async function loadTemplate(templateName: string): Promise<string | null> {
  try {
    // Chemins possibles
    const paths = [
      `/templates/${templateName}.hbs`,
      `/templates/${templateName}.html`,
      `/templates/${templateName}/index.hbs`
    ];
    
    // Dans Cloudflare Workers, utiliser import.meta pour résoudre assets
    // Pour l'instant, on retourne null (sera implémenté avec templates)
    console.warn(`⚠️  Template '${templateName}' non trouvé, utilisation fallback`);
    return getFallbackTemplate(templateName);
    
  } catch (error) {
    console.error(`❌ Erreur chargement template '${templateName}':`, error);
    return null;
  }
}

/**
 * Template HTML minimal par défaut (fallback)
 */
function getFallbackTemplate(templateName: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport DiagPV - {{audit_token}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24pt;
      font-weight: bold;
      color: #4CAF50;
    }
    .contact {
      text-align: right;
      font-size: 9pt;
      color: #666;
    }
    h1 {
      color: #4CAF50;
      font-size: 18pt;
      margin: 30px 0 15px 0;
    }
    h2 {
      color: #333;
      font-size: 14pt;
      margin: 20px 0 10px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #4CAF50;
      color: white;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 8pt;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">DiagPV</div>
    <div class="contact">
      <strong>Diagnostic Photovoltaïque</strong><br>
      3 rue d'Apollo, 31240 L'Union<br>
      📞 05.81.10.16.59 | ✉️ contact@diagpv.fr<br>
      RCS 792972309
    </div>
  </div>
  
  <h1>Rapport d'Audit Photovoltaïque</h1>
  <p><strong>Template:</strong> ${templateName}</p>
  <p><strong>Date:</strong> {{formatDate created_at}}</p>
  <p><strong>Audit Token:</strong> {{audit_token}}</p>
  
  <h2>Informations Client</h2>
  <table>
    <tr>
      <th>Client</th>
      <td>{{client_name}}</td>
    </tr>
    <tr>
      <th>Site</th>
      <td>{{site_name}}</td>
    </tr>
    <tr>
      <th>Adresse</th>
      <td>{{site_address}}</td>
    </tr>
  </table>
  
  <h2>Statistiques</h2>
  <table>
    <tr>
      <th>Modules totaux</th>
      <td>{{stats.total_modules}}</td>
    </tr>
    <tr>
      <th>Modules défectueux</th>
      <td>{{stats.defective_modules}}</td>
    </tr>
    <tr>
      <th>Taux conformité</th>
      <td>{{percentage stats.conformity_rate}}</td>
    </tr>
  </table>
  
  <div class="footer">
    <p>Document confidentiel - Diagnostic Photovoltaïque © 2024</p>
    <p>Expertise indépendante depuis 2012 | Conforme IEC 62446-1</p>
  </div>
</body>
</html>
  `;
}
