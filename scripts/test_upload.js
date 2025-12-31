const fs = require('fs')
const http = require('http')
const path = require('path')

const filePath = process.argv[2] || path.join(__dirname, '..', 'uploads', '1767114580827-10012025 to 12312025 Registrations Report.csv')
if (!fs.existsSync(filePath)){
  console.error('File not found:', filePath)
  process.exit(1)
}

const boundary = '----WebKitFormBoundary' + Date.now().toString(16)
const fileName = path.basename(filePath)
const pre = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`
const post = `\r\n--${boundary}--\r\n`

const stats = fs.statSync(filePath)
const contentLength = Buffer.byteLength(pre) + stats.size + Buffer.byteLength(post)

const options = {
  hostname: '127.0.0.1',
  port: 4000,
  path: '/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': contentLength
  }
}

const req = http.request(options, res => {
  console.log('STATUS', res.statusCode)
  let body = ''
  res.setEncoding('utf8')
  res.on('data', chunk => body += chunk)
  res.on('end', () => {
    console.log('RESPONSE:', body)
    process.exit(res.statusCode === 200 ? 0 : 2)
  })
})
req.on('error', err => {
  console.error('REQUEST ERROR')
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})

req.write(pre)
const rs = fs.createReadStream(filePath)
rs.on('end', () => {
  req.end(post)
})
rs.pipe(req, { end: false })
