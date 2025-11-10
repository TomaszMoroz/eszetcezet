const http = require('http')

const url = 'http://localhost:3000/api/health'
const req = http.get(url, (res) => {
  console.log('status', res.statusCode)
  let body = ''
  res.on('data', (chunk) => (body += chunk))
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body)
      console.log('body', parsed)
      if (parsed.ok) process.exit(0)
      else process.exit(1)
    } catch (e) {
      console.log('body', body)
      process.exit(res.statusCode === 200 ? 0 : 1)
    }
  })
})

req.on('error', (err) => {
  console.error('error', err && err.message ? err.message : err)
  process.exit(2)
})
