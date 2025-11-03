// Test DXF parser isolé
const fs = require('fs')
const DxfParser = require('dxf-parser')

console.log('🔧 Test Parser DXF OpenSolar')
console.log('=' .repeat(50))

// Lire fichier DXF
const dxfContent = fs.readFileSync('./test-example.dxf', 'utf8')
console.log('✅ Fichier DXF lu:', dxfContent.length, 'caractères')

// Parser DXF
const parser = new DxfParser()
let dxf

try {
  dxf = parser.parseSync(dxfContent)
  console.log('✅ DXF parsé avec succès')
} catch (error) {
  console.error('❌ Erreur parsing:', error.message)
  process.exit(1)
}

// Analyser structure
console.log('\n📊 Structure DXF:')
console.log('Layers disponibles:', Object.keys(dxf.tables.layer.layers))
console.log('Entités totales:', dxf.entities.length)

// Filtrer layer PANELS
const panelEntities = dxf.entities.filter(e => 
  e.layer === 'PANELS' || e.layer === 'Panels'
)

console.log('\n📦 Layer PANELS:')
console.log('Entités trouvées:', panelEntities.length)

// Extraire rectangles
const moduleRectangles = []

for (const entity of panelEntities) {
  console.log(`\nEntité type: ${entity.type}`)
  
  if (entity.type === 'LWPOLYLINE') {
    const vertices = entity.vertices
    console.log('Vertices:', vertices.length)
    
    if (vertices && vertices.length >= 4) {
      vertices.forEach((v, i) => {
        console.log(`  V${i}: x=${v.x}, y=${v.y}`)
      })
      
      // Calculer centre
      const centerX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length
      const centerY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length
      
      // Calculer dimensions
      const width = Math.abs(vertices[1].x - vertices[0].x)
      const height = Math.abs(vertices[2].y - vertices[1].y)
      
      moduleRectangles.push({
        centerX,
        centerY,
        width,
        height,
        type: 'polyline'
      })
      
      console.log(`  → Centre: (${centerX.toFixed(2)}, ${centerY.toFixed(2)})`)
      console.log(`  → Dimensions: ${width.toFixed(2)}m × ${height.toFixed(2)}m`)
    }
  }
}

console.log('\n✅ Rectangles extraits:', moduleRectangles.length)

// Simuler conversion GPS
console.log('\n📍 Simulation conversion GPS:')
const refLat = 48.8566  // Paris
const refLng = 2.3522

moduleRectangles.forEach((rect, i) => {
  const latOffset = rect.centerY / 111320
  const lngOffset = rect.centerX / (111320 * Math.cos(refLat * Math.PI / 180))
  
  const moduleLat = refLat + latOffset
  const moduleLng = refLng + lngOffset
  
  console.log(`Module ${i + 1}: (${moduleLat.toFixed(6)}, ${moduleLng.toFixed(6)})`)
})

console.log('\n✅ Test terminé avec succès!')
