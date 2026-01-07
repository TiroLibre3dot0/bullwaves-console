const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const svgPath = path.join(__dirname, '../public/og-image-weekly-map.svg')
const pngPath = path.join(__dirname, '../public/og-image-weekly-map.png')
const jpgPath = path.join(__dirname, '../public/og-image-weekly-map.jpg')

console.log('Converting SVG to PNG and JPG...')

Promise.all([
  sharp(svgPath)
    .resize(1200, 630)
    .png()
    .toFile(pngPath),
  sharp(svgPath)
    .resize(1200, 630)
    .jpeg({ quality: 90 })
    .toFile(jpgPath)
])
  .then(() => {
    const pngStats = fs.statSync(pngPath)
    const jpgStats = fs.statSync(jpgPath)
    console.log('✓ PNG created:', pngPath, `(${(pngStats.size / 1024).toFixed(2)} KB)`)
    console.log('✓ JPG created:', jpgPath, `(${(jpgStats.size / 1024).toFixed(2)} KB)`)
  })
  .catch((err) => {
    console.error('✗ Error converting SVG:', err.message)
    process.exit(1)
  })
