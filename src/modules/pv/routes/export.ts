// ============================================================================
// PV CARTO - Export Routes (GeoJSON/KML)
// ============================================================================
// Export des modules avec coordonnées GPS pour traçabilité IEC 62446-1

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
}

const exportRouter = new Hono<{ Bindings: Bindings }>()

// ============================================================================
// GET /:plantId/zones/:zoneId/export/geojson
// ============================================================================
// Export GeoJSON - Format standard cartographie web (Leaflet, QGIS)
exportRouter.get('/:plantId/zones/:zoneId/export/geojson', async (c) => {
  const { env } = c
  const { plantId, zoneId } = c.req.param()

  try {
    // Récupérer zone + centrale
    const zone = await env.DB.prepare(`
      SELECT z.*, p.plant_name, p.address, p.city
      FROM pv_zones z
      JOIN pv_plants p ON z.plant_id = p.id
      WHERE z.id = ? AND p.id = ?
    `).bind(zoneId, plantId).first()

    if (!zone) {
      return c.json({ error: 'Zone non trouvée' }, 404)
    }

    // Récupérer tous les modules avec coordonnées GPS
    const modules = await env.DB.prepare(`
      SELECT 
        id,
        module_identifier,
        string_number,
        position_in_string,
        latitude,
        longitude,
        power_wp,
        brand,
        model,
        module_status,
        el_defect_type,
        el_severity_level,
        el_notes,
        ir_hotspot_temp,
        notes,
        created_at
      FROM pv_modules
      WHERE zone_id = ?
      ORDER BY string_number, position_in_string
    `).bind(zoneId).all()

    if (!modules.results || modules.results.length === 0) {
      return c.json({ error: 'Aucun module dans cette zone' }, 400)
    }

    // Générer GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      metadata: {
        generated_at: new Date().toISOString(),
        plant_name: zone.plant_name,
        zone_name: zone.zone_name,
        address: `${zone.address || ''}, ${zone.city || ''}`.trim(),
        total_modules: modules.results.length,
        standard: 'IEC 62446-1',
        export_source: 'DiagPV Carto Editor V2'
      },
      features: modules.results.map((m: any) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [m.longitude, m.latitude] // GeoJSON: [lng, lat]
        },
        properties: {
          id: m.id,
          module_identifier: m.module_identifier,
          string_number: m.string_number,
          position_in_string: m.position_in_string,
          power_wp: m.power_wp,
          brand: m.brand,
          model: m.model,
          module_status: m.module_status,
          el_defect_type: m.el_defect_type,
          el_severity_level: m.el_severity_level,
          el_notes: m.el_notes,
          ir_hotspot_temp: m.ir_hotspot_temp,
          notes: m.notes,
          created_at: m.created_at
        }
      }))
    }

    // Headers pour téléchargement fichier
    const filename = `${zone.plant_name}_${zone.zone_name}_modules_${new Date().toISOString().split('T')[0]}.geojson`
    c.header('Content-Type', 'application/geo+json')
    c.header('Content-Disposition', `attachment; filename="${filename}"`)

    return c.json(geojson)

  } catch (error: any) {
    console.error('❌ Export GeoJSON error:', error)
    return c.json({ error: 'Erreur export GeoJSON', details: error.message }, 500)
  }
})

// ============================================================================
// GET /:plantId/zones/:zoneId/export/kml
// ============================================================================
// Export KML - Format compatible Google Earth / Google Maps
exportRouter.get('/:plantId/zones/:zoneId/export/kml', async (c) => {
  const { env } = c
  const { plantId, zoneId } = c.req.param()

  try {
    // Récupérer zone + centrale
    const zone = await env.DB.prepare(`
      SELECT z.*, p.plant_name, p.address, p.city
      FROM pv_zones z
      JOIN pv_plants p ON z.plant_id = p.id
      WHERE z.id = ? AND p.id = ?
    `).bind(zoneId, plantId).first()

    if (!zone) {
      return c.json({ error: 'Zone non trouvée' }, 404)
    }

    // Récupérer tous les modules
    const modules = await env.DB.prepare(`
      SELECT 
        id,
        module_identifier,
        string_number,
        position_in_string,
        latitude,
        longitude,
        power_wp,
        brand,
        model,
        module_status,
        el_defect_type,
        el_severity_level,
        el_notes,
        ir_hotspot_temp,
        notes
      FROM pv_modules
      WHERE zone_id = ?
      ORDER BY string_number, position_in_string
    `).bind(zoneId).all()

    if (!modules.results || modules.results.length === 0) {
      return c.json({ error: 'Aucun module dans cette zone' }, 400)
    }

    // Générer KML
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${zone.plant_name} - ${zone.zone_name}</name>
    <description>
      Export DiagPV Carto Editor V2
      Date: ${new Date().toISOString()}
      Norme: IEC 62446-1
      Modules: ${modules.results.length}
      Adresse: ${zone.address || ''}, ${zone.city || ''}
    </description>
    
    <!-- Styles pour les différents statuts de modules -->
    <Style id="module_ok">
      <IconStyle>
        <color>ff00ff00</color>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="module_warning">
      <IconStyle>
        <color>ff00ffff</color>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="module_error">
      <IconStyle>
        <color>ff0000ff</color>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="module_pending">
      <IconStyle>
        <color>ffaaaaaa</color>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon>
      </IconStyle>
    </Style>

${modules.results.map((m: any) => {
  // Déterminer style selon défaut
  let styleUrl = '#module_pending'
  if (m.module_status === 'ok') styleUrl = '#module_ok'
  else if (m.el_severity_level >= 3) styleUrl = '#module_error'
  else if (m.el_severity_level > 0) styleUrl = '#module_warning'

  return `    <Placemark>
      <name>${m.module_identifier}</name>
      <description><![CDATA[
        <b>String ${m.string_number} - Position ${m.position_in_string}</b><br/>
        Puissance: ${m.power_wp}Wp<br/>
        ${m.brand ? `Marque: ${m.brand}<br/>` : ''}
        ${m.model ? `Modèle: ${m.model}<br/>` : ''}
        Statut: ${m.module_status || 'pending'}<br/>
        ${m.el_defect_type ? `Défaut EL: ${m.el_defect_type} (sévérité ${m.el_severity_level})<br/>` : ''}
        ${m.ir_hotspot_temp ? `T° IR: ${m.ir_hotspot_temp}°C<br/>` : ''}
        ${m.el_notes ? `Notes EL: ${m.el_notes}<br/>` : ''}
        ${m.notes ? `Notes: ${m.notes}<br/>` : ''}
      ]]></description>
      <styleUrl>${styleUrl}</styleUrl>
      <Point>
        <coordinates>${m.longitude},${m.latitude},0</coordinates>
      </Point>
    </Placemark>`
}).join('\n')}

  </Document>
</kml>`

    // Headers pour téléchargement fichier
    const filename = `${zone.plant_name}_${zone.zone_name}_modules_${new Date().toISOString().split('T')[0]}.kml`
    c.header('Content-Type', 'application/vnd.google-earth.kml+xml')
    c.header('Content-Disposition', `attachment; filename="${filename}"`)

    return c.text(kml)

  } catch (error: any) {
    console.error('❌ Export KML error:', error)
    return c.json({ error: 'Erreur export KML', details: error.message }, 500)
  }
})

// ============================================================================
// GET /:plantId/zones/:zoneId/export/csv
// ============================================================================
// Export CSV - Format tableur pour analyse Excel/LibreOffice
exportRouter.get('/:plantId/zones/:zoneId/export/csv', async (c) => {
  const { env } = c
  const { plantId, zoneId } = c.req.param()

  try {
    // Récupérer zone + centrale
    const zone = await env.DB.prepare(`
      SELECT z.*, p.plant_name
      FROM pv_zones z
      JOIN pv_plants p ON z.plant_id = p.id
      WHERE z.id = ? AND p.id = ?
    `).bind(zoneId, plantId).first()

    if (!zone) {
      return c.json({ error: 'Zone non trouvée' }, 404)
    }

    // Récupérer tous les modules
    const modules = await env.DB.prepare(`
      SELECT 
        module_identifier,
        string_number,
        position_in_string,
        latitude,
        longitude,
        power_wp,
        brand,
        model,
        module_status,
        el_defect_type,
        el_severity_level,
        el_notes,
        ir_hotspot_temp,
        notes
      FROM pv_modules
      WHERE zone_id = ?
      ORDER BY string_number, position_in_string
    `).bind(zoneId).all()

    if (!modules.results || modules.results.length === 0) {
      return c.json({ error: 'Aucun module dans cette zone' }, 400)
    }

    // Générer CSV
    const headers = [
      'module_identifier',
      'string_number',
      'position_in_string',
      'latitude',
      'longitude',
      'power_wp',
      'brand',
      'model',
      'module_status',
      'el_defect_type',
      'el_severity_level',
      'el_notes',
      'ir_hotspot_temp',
      'notes'
    ]

    const csv = [
      headers.join(','),
      ...modules.results.map((m: any) => 
        headers.map(h => {
          const value = m[h] ?? ''
          // Échapper les virgules et guillemets
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value
        }).join(',')
      )
    ].join('\n')

    // Headers pour téléchargement fichier
    const filename = `${zone.plant_name}_${zone.zone_name}_modules_${new Date().toISOString().split('T')[0]}.csv`
    c.header('Content-Type', 'text/csv; charset=utf-8')
    c.header('Content-Disposition', `attachment; filename="${filename}"`)

    return c.text('\ufeff' + csv) // BOM UTF-8 pour Excel

  } catch (error: any) {
    console.error('❌ Export CSV error:', error)
    return c.json({ error: 'Erreur export CSV', details: error.message }, 500)
  }
})

export default exportRouter
