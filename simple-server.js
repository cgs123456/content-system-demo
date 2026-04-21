
const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Request received:', req.url, req.method);
  
  if (req.url === '/' || req.url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Test</title></head><body><h1>✅ Server is working!</h1><p>Success! Server is running on port 3001</p></body></html>');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(3001, () => {
  console.log('========================================');
  console.log('  Simple Test Server');
  console.log('========================================');
  console.log('Server running on http://localhost:3001');
  console.log('========================================');
});
