const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const svgPath = path.join(__dirname, '../public/og-image-weekly-map.svg')
const pngPath = path.join(__dirname, '../public/og-image-weekly-map.png')

console.log('Converting SVG to PNG...')

sharp(svgPath)
  .resize(1200, 630)
  .png()
  .toFile(pngPath)
  .then(() => {
    console.log('✓ PNG created successfully:', pngPath)
    const stats = fs.statSync(pngPath)
    console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`)
  })
  .catch((err) => {
    console.error('✗ Error converting SVG to PNG:', err.message)
    process.exit(1)
  })
